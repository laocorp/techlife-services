'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getDashboardStatsAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    const tenantId = profile?.tenant_id

    // 1. Total Active Orders (not delivered)
    const { count: activeOrders } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .neq('status', 'delivered')

    // 2. Total Completed Orders (delivered)
    const { count: completedOrders } = await supabase
        .from('service_orders')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'delivered')

    // 3. Total Customers
    const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

    // 4. Monthly Revenue (Current Month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfMonth.toISOString())

    const monthlyRevenue = (payments || []).reduce((sum, p) => sum + p.amount, 0)

    return {
        activeOrders: activeOrders || 0,
        completedOrders: completedOrders || 0,
        totalCustomers: totalCustomers || 0,
        monthlyRevenue
    }
}

export async function getRevenueChartDataAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()
    const tenantId = profile?.tenant_id

    // Get payments from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('tenant_id', tenantId)
        .gte('created_at', sevenDaysAgo.toISOString())

    const { data: sales } = await supabase
        .from('sales_orders')
        .select('total_amount, created_at')
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid')
        .gte('created_at', sevenDaysAgo.toISOString())

    // Aggregate by day
    const chartData = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD

        const dayServiceTotal = (payments || [])
            .filter(p => p.created_at.startsWith(dateStr))
            .reduce((sum, p) => sum + p.amount, 0)

        const daySalesTotal = (sales || [])
            .filter(s => s.created_at.startsWith(dateStr))
            .reduce((sum, s) => sum + s.total_amount, 0)

        const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' })
        chartData.push({ date: dayName, revenue: dayServiceTotal + daySalesTotal })
    }

    return chartData
}

export async function getStatusDistributionAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    const { data: orders } = await supabase
        .from('service_orders')
        .select('status')
        .eq('tenant_id', profile?.tenant_id)

    const distribution = (orders || []).reduce((acc: any, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
    }, {})

    return Object.entries(distribution).map(([status, count]) => ({
        name: status,
        value: count
    }))
}
