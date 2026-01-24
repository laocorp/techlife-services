'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getPortalCustomerAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .single()

    return customer
}

export async function getPortalOrdersAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // RLS should handle filtering, but let's be explicit with the join if needed for performance,
    // although RLS is safest. 
    // Just select * from service_orders should work due to the policy:
    // "Portal: Customers can view own orders"

    const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
            *,
            customer_assets (identifier, details)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching portal orders:', error)
        return []
    }

    return orders || []
}

export async function getPortalAssetsAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: assets, error } = await supabase
        .from('customer_assets')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching portal assets:', error)
        return []
    }

    return assets || []
}
