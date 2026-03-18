import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SalesMetricsView from '@/components/features/sales/SalesMetricsView'
import { getSalesMetricsAction, getSalesHistoryAction } from '@/lib/actions/sales'

export default async function SalesMetricsPage({ searchParams }: { searchParams: Promise<{ start?: string, end?: string }> }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    // Only Owner, Manager, and Head Technician can view sales metrics
    const allowedRoles = ['owner', 'manager', 'head_technician']
    if (!profile || !allowedRoles.includes(profile.role)) {
        redirect('/dashboard')
    }

    const { start, end } = await searchParams
    const metrics = await getSalesMetricsAction(start, end)
    // Detailed list for "fusion"
    const history = await getSalesHistoryAction(start, end)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <SalesMetricsView metrics={metrics} history={history} />
        </div>
    )
}
