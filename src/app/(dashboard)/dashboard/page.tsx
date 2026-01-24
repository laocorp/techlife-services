import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDashboardStatsAction, getRevenueChartDataAction, getStatusDistributionAction } from '@/lib/actions/dashboard'
import { Activity, CheckCircle, Users, Smartphone, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import RevenueChart from '@/components/features/bi/RevenueChart'
import StatusDistributionChart from '@/components/features/bi/StatusDistributionChart'

export default async function DashboardPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, tenants(name)')
        .eq('id', user.id)
        .single()

    const [stats, revenueData, statusData] = await Promise.all([
        getDashboardStatsAction(),
        getRevenueChartDataAction(),
        getStatusDistributionAction()
    ])

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">
                        Bienvenido de nuevo, <span className="font-semibold text-indigo-600">{profile?.full_name}</span>
                    </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border shadow-sm text-sm text-slate-600">
                    {profile?.tenants?.name}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Active Orders */}
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Activity className="h-6 w-6 text-indigo-600" />
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            En Proceso
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.activeOrders ?? '-'}</div>
                    <p className="text-sm text-slate-500">Órdenes Activas</p>
                </div>

                {/* Delivered Orders */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.completedOrders ?? '-'}</div>
                    <p className="text-sm text-slate-500">Entregados</p>
                </div>

                {/* Customers */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalCustomers ?? '-'}</div>
                    <p className="text-sm text-slate-500">Clientes Registrados</p>
                </div>

                {/* Assets */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Smartphone className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalAssets ?? '-'}</div>
                    <p className="text-sm text-slate-500">Equipos en Historial</p>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RevenueChart data={revenueData} />
                <StatusDistributionChart data={statusData} />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Accesos Rápidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/orders/new" className="group flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-slate-700">Nueva Orden de Servicio</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </Link>

                    <Link href="/customers" className="group flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-slate-700">Ver Clientes</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
