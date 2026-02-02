import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import StoreOrderList from '@/components/features/pos/StoreOrderList'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function PosHistoryPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch POS orders (Now stored in ecommerce_orders)
    // We assume POS orders have 'pending' or 'delivered' status and shipping_address containing 'Mostrador' or similar marker,
    // OR we just show all ecommerce orders for this tenant. 
    // Given the single-db MVP, we filter by tenant if possible (but header check handles it for profiles).
    // Let's rely on profiles RLS (which we set up for 'ecommerce_orders' to allow insert/select? No, we set 'Enable select for all' for ID check)
    // Wait, check_policies.sql said "Enable select for all users" using (true).
    // So we need to filter by tenant manually here or via RLS if we had a tenant-specific policy.
    // Ideally we should have restricted RLS to tenant for "SELECT *". The current "using (true)" is risky for multi-tenant isolation if we don't filter.
    // BUT for this fix: query 'ecommerce_orders' and potentially filter by some POS characteristic?
    // ecommerce_orders has 'shipping_address' jsonb.
    // For now, let's just show all orders for the current user's tenant?
    // We need to fetch tenant_id first to be safe, or just query.

    // Get Tenant ID Security Check
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!profile?.tenant_id) return <div className="p-8 text-slate-500 dark:text-slate-400">No autorizado</div>

    const { data: orders, error } = await supabase
        .from('ecommerce_orders')
        .select(`
            id,
            total_amount,
            status,
            created_at,
            payment_status
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('POS History Error:', error)
        return (
            <div className="p-8 text-red-500 dark:text-red-400">
                <h3 className="font-bold">Error cargando historial</h3>
                <pre className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded text-xs overflow-auto text-red-600 dark:text-red-300">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        )
    }

    // Fetch details for payments to show method if needed? 
    // Or we accept that orders table doesn't have method.
    // For MVP, we show just list of orders. 

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-100 dark:bg-slate-900 min-h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Historial de Ventas POS</h1>
                <Badge variant="outline" className="border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">Últimas 50 transacciones</Badge>
            </div>

            <StoreOrderList orders={orders} />
        </div>
    )
}
