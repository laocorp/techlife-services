import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDashboardStatsAction, getRevenueChartDataAction, getStatusDistributionAction } from '@/lib/actions/dashboard'
import { Activity, CheckCircle, Users, Smartphone, Clock, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">
                        Bienvenido de nuevo, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{profile?.full_name}</span>
                    </p>
                </div>
                <div className="bg-card px-4 py-2 rounded-lg border shadow-sm text-sm text-muted-foreground">
                    {profile?.tenants?.name}
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-4">
                                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-foreground">{stats.activeOrders}</h3>
                                <p className="text-muted-foreground mt-1">Órdenes Activas</p>
                            </div>
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                                En Proceso
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mb-4">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-foreground">{stats.completedOrders}</h3>
                                <p className="text-muted-foreground mt-1">Entregados</p>
                            </div>
                            {/* <Badge variant="secondary" className="bg-green-50 text-green-700">+12%</Badge> */}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg w-fit mb-4">
                                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-foreground">{stats.totalCustomers}</h3>
                                <p className="text-muted-foreground mt-1">Clientes Registrados</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mb-4">
                                    <Smartphone className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-3xl font-bold text-foreground">{stats.totalAssets}</h3>
                                <p className="text-muted-foreground mt-1">Equipos en Historial</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <RevenueChart data={revenueData} />
                <StatusDistributionChart data={statusData} />
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Accesos Rápidos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/orders/new" className="group flex items-center justify-between p-4 rounded-lg border border-border hover:border-indigo-300 hover:bg-muted/50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-foreground">Nueva Orden de Servicio</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                    </Link>

                    <Link href="/customers" className="group flex items-center justify-between p-4 rounded-lg border border-border hover:border-indigo-300 hover:bg-muted/50 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="font-medium text-foreground">Ver Clientes</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
