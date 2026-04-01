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
import DispatchPanel from '@/components/features/dashboard/DispatchPanel'
import SalesDashboard from '@/components/features/dashboard/SalesDashboard'
import CashierDashboard from '@/components/features/dashboard/CashierDashboard'
import { getOrdersByBranchAction, getPendingPaymentOrdersAction } from '@/lib/actions/orders'
import { getStaffAction } from '@/lib/actions/staff'
import { getProductsAction } from '@/lib/actions/inventory'
import { getCustomersAction } from '@/lib/actions/customers'
import { Button } from '@/components/ui/button'
import { Package, AlertCircle } from 'lucide-react'

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

    const role = profile?.role || 'technician'

    // --- VIEW SPECIFIC LOGIC ---
    // SALES (Store & Field): Product Catalog + Cart
    if (role === 'sales_store' || role === 'sales_field') {
        const [products, customers] = await Promise.all([
            getProductsAction(),
            getCustomersAction()
        ])

        return (
            <div className="p-4 md:p-8 max-w-[1800px] mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Punto de Venta</h1>
                    <p className="text-muted-foreground mt-1">
                        Hola <span className="font-semibold text-purple-600">{profile?.full_name}</span>, registra tus ventas.
                    </p>
                </div>
                <SalesDashboard products={products} customers={customers} userRole={role} />
            </div>
        )
    }

    // CASHIER: Payment Processing
    if (role === 'cashier') {
        const pendingOrders = await getPendingPaymentOrdersAction()

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <CashierDashboard pendingOrders={pendingOrders} />
            </div>
        )
    }

    // HEAD TECHNICIAN: Dispatch Panel (Full Branch View)
    if (role === 'head_technician') {
        const [branchOrders, staff] = await Promise.all([
            getOrdersByBranchAction(profile?.branch_id),
            getStaffAction()
        ])
        const techList = staff.filter((s: any) => s.role === 'technician' || s.role === 'head_technician')

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* --- PREMIUM APP-STYLE WELCOME CARD --- */}
                <div className="relative overflow-hidden rounded-3xl bg-indigo-600 p-8 text-white shadow-2xl shadow-indigo-200">
                    <div className="relative z-10">
                        <Badge className="mb-4 bg-indigo-500/30 text-indigo-100 border-none backdrop-blur-md">Gestión de Sede</Badge>
                        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                            ¡Hola, {profile?.full_name?.split(' ')[0]}! 👋
                        </h1>
                        <p className="mt-2 text-indigo-100/80 max-w-md">
                            Tienes el control total de tu sede hoy. Revisa las asignaciones pendientes abajo.
                        </p>
                    </div>
                    {/* Decorative abstract shapes for depth */}
                    <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
                    <div className="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl" />
                </div>

                <DispatchPanel
                    unassigned={branchOrders.unassigned}
                    assigned={branchOrders.assigned}
                    technicians={techList}
                />
            </div>
        )
    }

    // TECHNICIAN: Personal Work Queue (My Assigned Orders)
    if (role === 'technician') {
        const { assigned } = await getOrdersByBranchAction(profile?.branch_id)
        // Filter only orders assigned to THIS technician
        const myOrders = assigned.filter((o: any) => o.assigned_to === user.id)

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Mis Reparaciones</h1>
                    <p className="text-muted-foreground mt-1">
                        Hola <span className="font-semibold text-blue-600">{profile?.full_name}</span>, tienes {myOrders.length} órdenes activas.
                    </p>
                </div>

                {/* Reusing DispatchPanel styles but simplified for single user view */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myOrders.length === 0 ? (
                        <div className="col-span-full text-center p-12 border rounded-lg border-dashed text-muted-foreground bg-muted/20">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                            <p>No tienes órdenes asignadas actualmente.</p>
                        </div>
                    ) : (
                        myOrders.map((order: any) => (
                            <Link href={`/orders/${order.id}`} key={order.id} className="block group">
                                <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500 h-full">
                                    <CardContent className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-lg flex items-center gap-2">
                                                    #{order.folio_id || order.id.slice(0, 6)}
                                                    {order.priority === 'urgent' && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
                                                </div>
                                                <div className="text-sm font-medium text-foreground/80 mt-1">{order.asset?.model || 'Dispositivo'}</div>
                                            </div>
                                            <Badge variant="outline" className="capitalize bg-blue-50 text-blue-700 border-blue-200">{order.status}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 bg-muted/30 p-2 rounded-md">
                                            {order.description_problem}
                                        </p>
                                        <div className="flex justify-between items-center pt-2 text-xs text-muted-foreground border-t border-border mt-2">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                                                Ver Detalles <ArrowRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        )
    }

    // WAREHOUSE: Inventory Management Dashboard
    if (role === 'warehouse_keeper') {
        const products = await getProductsAction() // Get all products
        // Simple stats for Warehouse
        const lowStock = products.filter((p: any) => p.quantity <= (p.min_stock || 5)).length

        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
                        <p className="text-muted-foreground mt-1">
                            Hola <span className="font-semibold text-orange-600">{profile?.full_name}</span>, estado del almacén.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{products.length}</h3>
                                    <p className="text-muted-foreground text-sm">Total Ítems</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">{lowStock}</h3>
                                    <p className="text-muted-foreground text-sm">Stock Bajo</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Redirect to full inventory view button */}
                <div className="text-center p-8 bg-muted/10 rounded-xl border border-dashed">
                    <h3 className="font-semibold text-lg mb-2">Gestión Completa</h3>
                    <p className="text-muted-foreground mb-4">Accede a la lista completa para editar, ajustar stock o ver historial.</p>
                    <Link href="/inventory">
                        <Button className="gap-2">
                            <Package className="h-4 w-4" />
                            Ir al Inventario Maestro
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    // RECEPTION: Front Desk Dashboard
    if (role === 'receptionist') {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground">Recepción</h1>
                    <p className="text-muted-foreground mt-1">
                        Hola <span className="font-semibold text-pink-600">{profile?.full_name}</span>, ¿qué deseas hacer hoy?
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
                    <Link href="/orders/new" className="group">
                        <Card className="h-full hover:border-pink-500 transition-colors cursor-pointer border-2 border-transparent shadow-sm hover:shadow-md bg-pink-50/50 dark:bg-pink-950/10">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Smartphone className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Nueva Orden</h3>
                                    <p className="text-muted-foreground mt-2">Registrar un dispositivo para reparación.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/customers" className="group">
                        <Card className="h-full hover:border-blue-500 transition-colors cursor-pointer border-2 border-transparent shadow-sm hover:shadow-md bg-blue-50/50 dark:bg-blue-950/10">
                            <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Users className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-foreground">Buscar Cliente</h3>
                                    <p className="text-muted-foreground mt-2">Consultar historial o editar datos de clientes.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        )
    }

    // OWNER / ADMIN / DEFAULT: Strategic Overview
    const [stats, revenueData, statusData] = await Promise.all([
        getDashboardStatsAction(),
        getRevenueChartDataAction(),
        getStatusDistributionAction()
    ])

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
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
                                <h3 className="text-3xl font-bold text-foreground">{stats?.activeOrders ?? 0}</h3>
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
                                <h3 className="text-3xl font-bold text-foreground">{stats?.completedOrders ?? 0}</h3>
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
                                <h3 className="text-3xl font-bold text-foreground">{stats?.totalCustomers ?? 0}</h3>
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
                                <h3 className="text-3xl font-bold text-foreground">{stats?.totalAssets ?? 0}</h3>
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
