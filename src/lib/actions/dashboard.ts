'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getDashboardStatsAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    try {
        // Parallel fetching for performance
        const [
            { count: activeOrdersCount, error: activeError },
            { count: totalOrdersCount, error: totalError },
            { count: customersCount, error: customersError },
            { count: assetsCount, error: assetsError }
        ] = await Promise.all([
            // Active Orders (not delivered)
            supabase.from('service_orders')
                .select('*', { count: 'exact', head: true })
                .neq('status', 'delivered'),

            // Total Orders
            supabase.from('service_orders')
                .select('*', { count: 'exact', head: true }),

            // Total Customers
            supabase.from('customers')
                .select('*', { count: 'exact', head: true }),

            // Total Assets
            supabase.from('customer_assets')
                .select('*', { count: 'exact', head: true })
        ])

        if (activeError || totalError || customersError || assetsError) {
            console.error('Error fetching dashboard stats:', { activeError, totalError, customersError })
            return null
        }

        return {
            activeOrders: activeOrdersCount || 0,
            completedOrders: (totalOrdersCount || 0) - (activeOrdersCount || 0),
            totalCustomers: customersCount || 0,
            totalAssets: assetsCount || 0
        }
    } catch (error) {
        console.error('Unexpected error fetching stats:', error)
        return null
    }
}

export async function getRevenueChartDataAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    // Need tenant_id, assume RLS handles it if we just filter by tenant_id or if we trust the RLS policies 
    // But our policies use get_current_tenant_id(), so we can just select from payments directly?
    // Wait, the action needs to pass the tenant_id explicitly?
    // RLS: "Users can view payments in same tenant" using (tenant_id = get_current_tenant_id())
    // So we don't strictly *need* to filter by tenant_id in the query if RLS is on, BUT for performance and correctness it's good practice.
    // However, to get tenant_id in server component we need to fetch profile first or trust RLS.
    // Let's count on RLS but fetching profile is safer.

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()
    const tenantId = profile?.tenant_id

    // Get payments from last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const { data: payments } = await supabase
        .from('payments')
        .select('amount, created_at')
        .eq('tenant_id', tenantId) // Explicit filter
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })

    // Aggregate by day
    const chartData = []

    // Create map for last 7 days
    for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo)
        d.setDate(d.getDate() + i)
        const dateStr = d.toISOString().split('T')[0] // YYYY-MM-DD

        const dayTotal = (payments || [])
            .filter(p => p.created_at.startsWith(dateStr))
            .reduce((sum, p) => sum + p.amount, 0)

        // Format: "Lun 20"
        const dayName = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
        chartData.push({ date: dayName, revenue: dayTotal })
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

    // Translate status for display
    const statusMap: Record<string, string> = {
        'reception': 'Recepción',
        'diagnosis': 'Diagnóstico',
        'approval': 'Aprobación',
        'repair': 'Reparación',
        'qa': 'Calidad',
        'ready': 'Listo',
        'delivered': 'Entregado'
    }

    const distribution = (orders || []).reduce((acc: any, order) => {
        // Only count active orders? Or all? Usually distribution is for active.
        // Let's do ALL non-delivered for the pie chart to see workload.
        if (order.status === 'delivered') return acc;

        const label = statusMap[order.status] || order.status
        acc[label] = (acc[label] || 0) + 1
        return acc
    }, {})

    return Object.entries(distribution).map(([status, count]) => ({
        name: status,
        value: count
    }))
}
