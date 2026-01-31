'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getSalesOrdersAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return []

    const { data: orders, error } = await supabase
        .from('ecommerce_orders')
        .select(`
            *,
            items:ecommerce_order_items(
                *,
                product:products(name)
            )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching sales orders:', error)
        return []
    }

    return orders
}

export async function updateSalesOrderStatusAction(orderId: string, status: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from('ecommerce_orders')
        .update({ status })
        .eq('id', orderId)

    if (error) throw new Error(error.message)
    return { success: true }
}
