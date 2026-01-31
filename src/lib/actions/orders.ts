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

    const validated = orderSchema.safeParse(data)
    if (!validated.success) return { error: 'Datos inválidos' }

    const { customerId, assetId, priority, description, notes } = validated.data

    let finalCustomerId = customerId
    try {
        const { ensureLocalCustomer } = await import('@/lib/actions/customers')
        finalCustomerId = await ensureLocalCustomer(customerId)
    } catch (e) {
        return { error: 'Error al procesar cliente virtual' }
    }

    const { error } = await supabase.from('service_orders').insert({
        tenant_id: profile.tenant_id,
        customer_id: finalCustomerId,
        asset_id: assetId,
        priority,
        description_problem: description,
        assigned_to: user.id, // Assign to creator by default for now
        // status defaults to 'reception'
    })

    if (error) {
        console.error('Create Order Error:', error)
        return { error: 'Error al crear orden' }
    }

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
            customers (full_name),
            customer_assets (identifier, details)
        `)
        .order('created_at', { ascending: false })

    if (filters?.assetId) {
        query = query.eq('asset_id', filters.assetId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)

    // Explicit casting or validation could go here
    return data as any[]
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
