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
    if (!validated.success) {
        console.error('Validation Invalid:', validated.error)
        return { error: 'Datos inválidos' }
    }

    const { customerId, assetId, priority, description, notes } = validated.data

    let finalCustomerId = customerId
    try {
        if (customerId.startsWith('virtual-')) {
            // Dynamic import to avoid circular dep if any
            const { ensureLocalCustomer } = await import('@/lib/actions/customers')
            finalCustomerId = await ensureLocalCustomer(customerId)
        }
    } catch (e: any) {
        console.error('Virtual Customer Error:', e)
        return { error: `Error virtual: ${e.message}` }
    }

    // NEW: Ensure Asset is Local (Handle Shared Assets)
    let finalAssetId = assetId
    try {
        const { ensureLocalAsset } = await import('@/lib/actions/assets')
        finalAssetId = await ensureLocalAsset(assetId, finalCustomerId, profile.tenant_id)
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
                }
            }
        }
    } catch (e) {
        console.error('Patch Error:', e)
    }

    return orders as any[]
}

export async function getOrdersByBranchAction(branchId?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { unassigned: [], assigned: [] }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, branch_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { unassigned: [], assigned: [] }

    const targetBranchId = branchId || profile.branch_id

    // If no branch assigned and no branch requested, return empty or all?
    // Usually Head Technician is assigned to a branch.
    // We fetch orders where:
    // 1. tenant_id matches
    // 2. branch_id matches (if we added branch_id to service_orders - wait, did we?)

    // Check Phase 14 Schema in previous steps. 
    // "Modified Tables: service_orders (added branch_id)" -> YES.

    let query = supabase
        .from('service_orders')
        .select(`
            *,
            customers (id, full_name),
            asset:customer_assets (identifier, details, brand, model),
            tech:profiles!service_orders_assigned_to_fkey (full_name, avatar_url)
        `)
        .eq('tenant_id', profile.tenant_id)
        .neq('status', 'delivered') // Exclude finished
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })

    if (targetBranchId) {
        query = query.eq('branch_id', targetBranchId)
    }

    const { data: orders, error } = await query

    if (error) {
        console.error('Error fetching branch orders:', error)
        return { unassigned: [], assigned: [] }
    }

    const unassigned = orders.filter(o => !o.assigned_to)
    const assigned = orders.filter(o => o.assigned_to)

    return { unassigned, assigned }
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

export async function createSalesOrderAction(data: {
    customerId: string,
    items: { productId: string, quantity: number, price: number }[],
    paymentProof?: string, // URL or ID
    notes?: string
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, id, role').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Sin tenant' }

    // 1. Create Order Header
    const { data: order, error: orderError } = await supabase
        .from('service_orders')
        .insert({
            tenant_id: profile.tenant_id,
            customer_id: data.customerId,
            description_problem: 'Venta Directa de Productos',
            priority: 'normal',
            status: 'pending_payment', // Waiting for Cashier
            sales_rep_id: profile.id, // Track Sales Rep
            assigned_to: null, // No technician needed
            // Store proof in metadata or notes? Notes for now.
            notes: data.notes || (data.paymentProof ? `Comprobante: ${data.paymentProof}` : undefined)
        })
        .select()
        .single()

    if (orderError) {
        console.error('Sales Order Create Error:', orderError)
        return { error: 'Error al crear la orden de venta' }
    }

    // 2. Insert Items
    const itemsToInsert = data.items.map(item => ({
        tenant_id: profile.tenant_id,
        service_order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.price
    }))

    const { error: itemsError } = await supabase
        .from('service_order_items')
        .insert(itemsToInsert)

    if (itemsError) {
        console.error('Sales Items Error:', itemsError)
        // Should rollback order? Supabase doesn't support transactions easily in client lib.
        // We'll leave it empty and alert user.
        return { error: 'Orden creada pero error al agregar productos. Contacte soporte.' }
    }


    // 3. Deduct Stock immediately (Reservation)
    const stockMovements = itemsToInsert.map(item => ({
        tenant_id: profile.tenant_id,
        product_id: item.product_id,
        type: 'out',
        quantity: item.quantity,
        notes: `Venta Orden #${order.id.slice(0, 8)}`,
        created_by: user.id
    }))

    const { error: stockError } = await supabase
        .from('inventory_movements')
        .insert(stockMovements)

    if (stockError) {
        console.error('Stock Update Error:', stockError)
        // Non-blocking but critical log. In a real app, this should be transactional with order creation.
    }

    // 3. Notification for Custoemr (if user_id exists)
    // Fetch customer user_id
    if (data.customerId) {
        const { data: customer } = await supabase
            .from('customers')
            .select('user_id')
            .eq('id', data.customerId)
            .single()

        if (customer?.user_id) {
            await supabase.from('notifications').insert({
                user_id: customer.user_id,
                title: 'Nueva Compra Registrada',
                message: `Se ha registrado una nueva orden #${order.folio_id || order.id.slice(0, 6)} a tu nombre. Total: $${order.total?.toFixed(2) || '0.00'}. Estado: Pendiente de Pago.`,
                type: 'info',
                link: `/portal/orders/${order.id}`,
                read: false
            })
        }
    }

    // 4. Notification for Cashier/Owner
    // Fetch users who should be notified (Cashiers, Managers, Owners)
    const { data: staffToNotify } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['cashier', 'owner', 'manager'])
        .eq('tenant_id', profile.tenant_id)

    if (staffToNotify && staffToNotify.length > 0) {
        const notifications = staffToNotify.map(staff => ({
            user_id: staff.id,
            title: 'Nueva Venta por Cobrar',
            message: `Orden #${order.folio_id || order.id.slice(0, 6)} creada por ${profile.role === 'sales_store' ? 'Tienda' : 'Vendedor'}. Pendiente de pago.`,
            type: 'info',
            link: '/dashboard/cashier', // Redirect to cashier view
            read: false
        }))

        await supabase.from('notifications').insert(notifications)
    }

    revalidatePath('/dashboard')
    return { success: true, orderId: order.id }
}

export async function getPendingPaymentOrdersAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
            *,
            customer:customers(full_name, email),
            items:service_order_items(
                quantity, 
                unit_price, 
                product:products(name)
            ),
            sales_rep:profiles!sales_rep_id(full_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'pending_payment')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching pending payments:', error)
        return []
    }

    return orders
}

export async function confirmPaymentAction(orderId: string, method: string, reference?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user?.id).single()

    if (profile?.role !== 'cashier' && profile?.role !== 'owner' && profile?.role !== 'manager') {
        return { error: 'No tienes permiso de Cajero' }
    }

    // Update Order Status
    // If it's a Sales Order (no asset), maybe go to 'delivered' or 'completed'?
    // Let's check if it has asset_id.
    const { data: order } = await supabase.from('service_orders').select('asset_id').eq('id', orderId).single()

    const newStatus = !order?.asset_id ? 'delivered' : 'ready' // If repair, maybe ready? Or just paid?
    // User said "Confirmacion de pago". Status flow: pending_payment -> paid?
    // But we use status for workflow.
    // If it's a generic sale, 'delivered' is fine.

    // Also Insert Payment Record
    // ... (assuming payments table exists or we just use status for now)

    const { error: updateError } = await supabase
        .from('service_orders')
        .update({
            status: newStatus,
            // updated_at: new Date() // handled by trigger usually
        })
        .eq('id', orderId)

    if (updateError) return { error: 'Error actualizando orden' }

    return { success: true }
}

export async function cancelOrderAction(orderId: string, reason?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()

    if (!profile || (profile.role !== 'cashier' && profile.role !== 'owner' && profile.role !== 'manager')) {
        return { error: 'No tienes permisos para cancelar órdenes.' }
    }

    // Use Secure RPC to bypass RLS complexity (Handles status update & stock restoration)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('cancel_order_endpoint', {
        p_order_id: orderId,
        p_reason: reason || 'Anulado en Caja'
    })

    if (rpcError) {
        console.error('RPC Error:', rpcError)
        return { error: `Error al cancelar: ${rpcError.message}` }
    }

    if (rpcResult && !rpcResult.success) {
        return { error: rpcResult.error || 'Error desconocido al cancelar' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/sales')

    return { success: true }
}
