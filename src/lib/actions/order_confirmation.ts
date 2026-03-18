'use server'

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function confirmOrderReceived(orderId: string) {
    const cookieStore = await cookies()
    const supabase = createServerClient(cookieStore)

    // Use admin client to bypass RLS for reading tenant users and inserting notifications
    const adminClient = createAdminClient()

    try {
        // 1. Get the order details (using regular client since user should have access)
        const { data: order, error: orderError } = await supabase
            .from('ecommerce_orders')
            .select('id, tenant_id, status')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            console.error('❌ [Server] Error fetching order:', orderError)
            return { success: false, error: 'Orden no encontrada' }
        }

        console.log('✅ [Server] Order found:', order.id, 'tenant_id:', order.tenant_id)

        // 2. Update order status to 'delivered' (using regular client with user auth)
        const { error: updateError } = await supabase
            .from('ecommerce_orders')
            .update({ status: 'delivered' })
            .eq('id', orderId)

        if (updateError) {
            console.error('Error updating order status:', updateError)
            return { success: false, error: 'No se pudo actualizar el estado' }
        }

        // 3. Get current user info for the notification message (using regular client)
        const { data: { user } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user?.id)
            .single()

        const clientName = profile?.full_name || 'El cliente'

        // 4. Get all users belonging to this tenant (using ADMIN client to bypass RLS)
        const { data: tenantUsers, error: tenantUsersError } = await adminClient
            .from('profiles')
            .select('id, full_name')
            .eq('tenant_id', order.tenant_id)

        // 5. Send notifications to all tenant users (using ADMIN client to bypass RLS)
        if (tenantUsers && tenantUsers.length > 0) {
            const notifications = tenantUsers.map((tenantUser) => ({
                user_id: tenantUser.id,
                title: '📦 Pedido Recibido',
                message: `${clientName} ha confirmado la recepción de la orden #${orderId.slice(0, 8)}`,
                link: `/pos/history?order=${orderId}`,
                read: false,
            }))

            const { error: notifError } = await adminClient
                .from('notifications')
                .insert(notifications)

            if (notifError) {
                console.error('Error inserting notifications:', notifError)
            }
        }

        return { success: true }

    } catch (error) {
        console.error('Error in confirmOrderReceived:', error)
        return { success: false, error: 'Error inesperado' }
    }
}
