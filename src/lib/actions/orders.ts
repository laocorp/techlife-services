'use server'

import { createClient } from '@/lib/supabase/server'
import { orderSchema, OrderFormData } from '@/lib/validations/orders'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

    const { error } = await supabase.from('service_orders').insert({
        tenant_id: profile.tenant_id,
        customer_id: customerId,
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
    return data
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

    // --- AUTOMATION / WEBHOOKS TRIGGER ---
    try {
        // 1. Get tenant_id from user
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

        if (profile?.tenant_id) {
            // 2. Fetch active webhooks for this tenant and event type
            const { data: webhooks } = await supabase
                .from('webhooks')
                .select('url, secret')
                .eq('tenant_id', profile.tenant_id)
                .eq('is_active', true)
                .in('event_type', ['order.status_change', '*']) // support wildcard

            if (webhooks && webhooks.length > 0) {
                // 3. Prepare payload
                const payload = {
                    event: 'order.status_change',
                    timestamp: new Date().toISOString(),
                    data: {
                        orderId,
                        newStatus,
                        updatedBy: user?.id
                    }
                }

                // 4. Fire and forget (simulated async)
                // In a real edge function environment we would fetch here.
                // Since this is a server action, fetch is valid.
                // We use Promise.allSettled to not block main thread too long or fail the action

                // Note: We use 'void' to detatch the promise so the response returns immediately to client
                // BUT Vercel/NextJS functions might kill the process if response is sent.
                // For safety in this MVP, we await with a short timeout or just await.
                // Let's await to be safe ensuring delivery log.

                const promises = webhooks.map(webhook =>
                    fetch(webhook.url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-TechLife-Signature': webhook.secret || ''
                        },
                        body: JSON.stringify(payload)
                    }).catch(err => console.error(`Webhook failed to ${webhook.url}`, err))
                )

                // Optional: await Promise.all(promises)
                // For now, we just let it run. In production properly use Background Jobs (Inngest/Trigger.dev)
                Promise.allSettled(promises).then(results => {
                    console.log(`Webhooks processed for order ${orderId}`, results.length)
                })
            }
        }
    } catch (err) {
        console.error('Automation Trigger Error (Non-blocking):', err)
    }
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
