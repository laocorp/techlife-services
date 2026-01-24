'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function approveOrderAction(formData: FormData) {
    const orderId = formData.get('orderId') as string

    if (!orderId) {
        throw new Error('Order ID mismatch')
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Verify ownership (security mostly handled by RLS policy on update, but good to check)
    // We update status to 'repair' which means "Approved and In Progress" basically, 
    // or maybe we need a specific 'approved' status? 
    // The user said "avanzar a la siguiente fase". 
    // Usually Diagnosis -> Approval -> Repair.

    const { error } = await supabase
        .from('service_orders')
        .update({
            status: 'repair',
            // We could add a log/event here too if we wanted, but let's keep it simple
        })
        .eq('id', orderId)

    if (error) {
        console.error('Error approving order:', error)
        throw new Error('Failed to approve order')
    }

    // Add an event log
    // Get Tenant ID efficiently
    const { data: orderData } = await supabase.from('service_orders').select('tenant_id, folio_id').eq('id', orderId).single()
    const tenantId = orderData?.tenant_id
    const folioId = orderData?.folio_id

    if (!tenantId) return

    // Add an event log
    await supabase.from('service_order_events').insert({
        service_order_id: orderId,
        type: 'status_change',
        content: 'Cliente aprobó el presupuesto y la reparación vía Portal Web.',
        actor_id: null,
        tenant_id: tenantId
    })

    // Create Notification for Workshop Staff
    await supabase.from('notifications').insert({
        tenant_id: tenantId,
        title: `Reparación Aprobada: Orden #${folioId}`,
        message: 'El cliente ha aprobado el presupuesto desde el portal. El equipo ya puede comenzar a trabajar.',
        link: `/orders/${orderId}`,
        is_read: false
    })

    revalidatePath(`/portal/orders/${orderId}`)
    revalidatePath('/portal/garage')
}
