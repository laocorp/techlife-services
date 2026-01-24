'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getPublicOrderAction(orderId: string) {
    const cookieStore = await cookies()
    // We use the standard client, but the RPC function uses 'security definer' 
    // so it bypasses RLS for this specific function call.
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.rpc('get_tracking_info', {
        p_order_id: orderId
    })

    if (error) {
        console.error('Error fetching public order:', error)
        return null
    }

    return data
}
