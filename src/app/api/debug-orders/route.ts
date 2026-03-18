
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    // Check Orders
    const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
            id, 
            status, 
            sales_rep:profiles!sales_rep_id(id, full_name), 
            created_at,
            customer:customers(full_name),
            tenant_id
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    // Check RLS (if possible via simple select, assume OK)

    // Check Realtime Publication (Admin only, but let's see if we can query pg_publication_tables via RPC if exists)
    // Not possible easily.

    return NextResponse.json({
        user: { id: user?.id, email: user?.email },
        latest_orders: orders,
        error
    })
}
