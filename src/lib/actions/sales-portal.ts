'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getAgentOrdersAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { orders: [], stats: null }

    // Fetch user's orders
    const { data: orders, error } = await supabase
        .from('service_orders')
        .select(`
            id,
            created_at,
            status,
            ticket_number,
            description_problem,
            total,
            items:service_order_items(quantity, unit_price),
            customer:customers(full_name, email)
        `)
        .eq('sales_rep_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching agent orders:', error)
        return { orders: [], stats: null }
    }

    // Calculate Stats
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    let totalSalesToday = 0
    let totalSalesMonth = 0
    const totalOrders = orders.length
    let pendingPayment = 0

    const enrichedOrders = orders.map(order => {
        // Calculate total manually if not present (fallback)
        const calculatedTotal = order.items?.reduce((sum: number, item: any) =>
            sum + (item.quantity * item.unit_price), 0) || 0

        const finalTotal = order.total || calculatedTotal

        // Update Stats
        if (order.created_at >= startOfDay) {
            totalSalesToday += finalTotal
        }
        if (order.created_at >= startOfMonth) {
            totalSalesMonth += finalTotal
        }
        if (order.status === 'pending_payment') {
            pendingPayment++
        }

        return {
            ...order,
            total: finalTotal
        }
    })

    const stats = {
        today: totalSalesToday,
        month: totalSalesMonth,
        totalOrders,
        pendingPayment
    }

    return { orders: enrichedOrders, stats }
}
