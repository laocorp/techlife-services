'use server'

import { createClient } from '@/lib/supabase/server'
import { orderSchema, OrderFormData } from '@/lib/validations/orders'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { triggerWebhook } from '@/lib/actions/webhookTrigger'

export async function createOrderAction(data: OrderFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // Get tenant_id
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Sin tenant' }

    console.log('--- CREATE ORDER STARTED ---')
    console.log('Input:', JSON.stringify(data))

    const validated = orderSchema.safeParse(data)
    if (!validated.success) {
        console.error('Validation Invalid:', validated.error)
        return { error: 'Datos inválidos' }
    }

    const { customerId, assetId, priority, description, notes } = validated.data
    console.log('Validated Data: ', { customerId, assetId })

    let finalCustomerId = customerId
    try {
        if (customerId.startsWith('virtual-')) {
            console.log('Detected Virtual Customer. Calling ensureLocalCustomer...')
            // Dynamic import to avoid circular dep if any
            const { ensureLocalCustomer } = await import('@/lib/actions/customers')
            finalCustomerId = await ensureLocalCustomer(customerId)
            console.log('ensureLocalCustomer Result:', finalCustomerId)
        }
    } catch (e: any) {
        console.error('Virtual Customer Error:', e)
        return { error: `Error virtual: ${e.message}` }
    }

    console.log('Final Customer ID for Insert:', finalCustomerId)

    // NEW: Ensure Asset is Local (Handle Shared Assets)
    let finalAssetId = assetId
    try {
        const { ensureLocalAsset } = await import('@/lib/actions/assets')
        finalAssetId = await ensureLocalAsset(assetId, finalCustomerId, profile.tenant_id)
        console.log('ensureLocalAsset Result:', finalAssetId)
    } catch (e: any) {
        console.error('Asset Import Error:', e)
        return { error: `Error al procesar activo: ${e.message}` }
    }

    const { error } = await supabase.from('service_orders').insert({
        tenant_id: profile.tenant_id,
        customer_id: finalCustomerId,
        asset_id: finalAssetId,
        priority,
        description_problem: description,
        assigned_to: user.id, // Assign to creator by default for now
        // status defaults to 'reception'
    })

    if (error) {
        console.error('Supabase Insert Error:', error)
        return { error: `DB Error: ${error.message}` }
    }

    console.log('Order Created Successfully')
    revalidatePath('/orders')
    return { success: true }
}

export async function getOrdersAction(filters?: { assetId?: string }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
        .from('service_orders')
        .select(`
            *,
            customers (id, full_name, user_id),
            customer_assets (identifier, details)
        `)
        .order('created_at', { ascending: false })

    if (filters?.assetId) {
        query = query.eq('asset_id', filters.assetId)
    }

    const { data: orders, error } = await query

    if (error) throw new Error(error.message)

    // Patch names with Connections (Fix for "Cliente Importado")
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
            if (profile?.tenant_id) {
                const { data: connections } = await supabase.rpc('get_tenant_connected_customers', {
                    p_tenant_id: profile.tenant_id
                })

                if (connections && orders) {
                    for (const order of orders) {
                        // @ts-ignore
                        const cust = order.customers
                        if (cust?.user_id) {
                            // @ts-ignore
                            const conn = connections.find(c => c.user_id === cust.user_id)
                            if (conn && conn.full_name) {
                                // Patch the display name
                                cust.full_name = conn.full_name
                            }
                        }
                    }
                    console.log('Patched orders with connection names')
                }
            }
        }
    } catch (e) {
        console.error('Patch Error:', e)
    }

    return orders as any[]
}

export async function getOrderByIdAction(orderId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('service_orders')
        .select(`
            *,
            customers (*),
            customer_assets (*),
            tenants (name, settings, logo_url, address, city, contact_phone, contact_email, website)
        `)
        .eq('id', orderId)
        .single()

    if (error) return null
    return data
}

export async function updateOrderStatusAction(orderId: string, newStatus: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // TODO: Verify transition logic here if we want strict rules
    // For now, allow any transition for flexibility

    const { error } = await supabase
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

    if (error) return { error: 'Error al actualizar estado' }

    if (error) return { error: 'Error al actualizar estado' }

    // --- NOTIFICATIONS (MANUAL LINK) ---
    // If status is "approval" (Esperando Aprobación), notify the customer.
    if (newStatus === 'approval') {
        const { data: order } = await supabase.from('service_orders').select('customer_id, folio_id, id').eq('id', orderId).single()

        if (order?.customer_id) {
            // Check if customer is connected (has user_id)
            const { data: customer } = await supabase.from('customers').select('user_id').eq('id', order.customer_id).single()

            if (customer?.user_id) {
                await supabase.from('notifications').insert({
                    user_id: customer.user_id,
                    title: 'Aprobación Requerida',
                    message: `Tu orden #${order.folio_id || order.id.slice(0, 6)} requiere tu aprobación para continuar.`,
                    type: 'warning',
                    link: `/portal/orders/${order.id}`,
                    read: false
                })
            }
        }
    }
    // -----------------------------------

    // --- AUTOMATION / WEBHOOKS TRIGGER ---

    // We fire this asynchronously without awaiting to ensure fast UI response
    // In Vercel serverless, we should ideally use waitUntil or similar, but for now:
    triggerWebhook('order.status_change', {
        orderId,
        newStatus,
        updatedBy: (await supabase.auth.getUser()).data.user?.id,
        timestamp: new Date().toISOString()
    }).catch((err: any) => console.error('Background webhook trigger failed', err))
    // -------------------------------------

    revalidatePath(`/orders/${orderId}`)
    return { success: true }
}

export async function assignTechnicianAction(orderId: string, technicianId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from('service_orders')
        .update({ assigned_to: technicianId })
        .eq('id', orderId)

    if (error) return { error: 'Error al asignar técnico' }

    revalidatePath(`/orders/${orderId}`)
    return { success: true }
}

export async function createWarrantyOrderAction(originalOrderId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Fetch Original
    const { data: original, error: fetchError } = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', originalOrderId)
        .single()

    if (fetchError || !original) return { error: 'Orden original no encontrada' }

    // 2. Create Warranty Clone
    const { data: newOrder, error: createError } = await supabase
        .from('service_orders')
        .insert({
            tenant_id: original.tenant_id,
            customer_id: original.customer_id,
            asset_id: original.asset_id,
            priority: 'urgent', // Warranties are urgent
            status: 'reception',
            description_problem: `[GARANTÍA] Reingreso por falla. Ref: #${original.folio_id || original.id.slice(0, 6)}. Problema original: ${original.description_problem}`,
            is_warranty: true,
            original_order_id: original.id,
            assigned_to: original.assigned_to // Optional: assign to same tech?
        })
        .select()
        .single()

    if (createError) {
        console.error('Warranty Creation Error:', createError)
        return { error: 'Error al crear garantía' }
    }

    revalidatePath('/orders')
    return { success: true, orderId: newOrder.id }
}

export async function deleteOrderAction(orderId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Sin tenant' }

    // 1. Delete Dependencies (Cascade)
    // We must manually delete dependent rows because Foreign Keys are likely RESTRICT

    // Items (service_order_items.service_order_id)
    const { error: itemsError } = await supabase
        .from('service_order_items')
        .delete()
        .eq('service_order_id', orderId)

    if (itemsError) console.error('Error deleting items:', itemsError)

    // Payments (payments.service_order_id)
    const { error: paymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('service_order_id', orderId)

    if (paymentsError) console.error('Error deleting payments:', paymentsError)

    // Events (service_order_events.service_order_id)
    const { error: eventsError } = await supabase
        .from('service_order_events')
        .delete()
        .eq('service_order_id', orderId)

    if (eventsError) console.error('Error deleting events:', eventsError)

    // 2. Delete Order
    const { error } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', orderId)
        .eq('tenant_id', profile.tenant_id)

    if (error) {
        console.error('Delete Order Error:', error)
        // Return detailed error for debugging
        return { error: `No se pudo eliminar: ${error.message} (Código: ${error.code})` }
    }

    revalidatePath('/orders')
    return { success: true }
}
