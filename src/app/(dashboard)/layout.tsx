import Link from 'next/link'
import Image from 'next/image'

import { LayoutDashboard, Users, Wrench, Package, Settings, DollarSign, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/components/common/NotificationBell'
import { FloatingNotification } from '@/components/common/FloatingNotification'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role, avatar_url')
        .eq('id', user.id)
        .single()

    if (profile?.role === 'client') {
        redirect('/portal/dashboard')
    }

    if (!profile || !profile.tenant_id) {
        // If they are logged in but have no profile/tenant (e.g., deleted from DB), force logout to clear cookies
        redirect('/auth/signout')
    }

    return (
        <div className="flex h-screen bg-background">




            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6 flex items-center gap-2">
                    <Image
                        src="/logo_transparent.png"
                        alt="Logo"
                        width={32}
                        height={32}
                        className="rounded-lg"
                    />
                    <h1 className="text-xl font-bold tracking-tight">TechLife<span className="text-indigo-400">Service</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        {profile?.role === 'sales_store' || profile?.role === 'sales_field' ? 'Punto de Venta' :
                            profile?.role === 'cashier' ? 'Caja' : 'Dashboard'}
                    </Link>

                    {/* --- OPERATIONAL MODULES --- */}

                    {/* Orders: Owner, Manager, Head Tech, Reception, Technician */}
                    {['owner', 'manager', 'head_technician', 'receptionist', 'technician'].includes(profile?.role || '') && (
                        <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                            <Wrench className="h-5 w-5" />
                            Órdenes
                        </Link>
                    )}

                    {/* Kanban: Owner, Manager, Head Tech (Techs use DispatchPanel/MyOrders) */}
                    {['owner', 'manager', 'head_technician'].includes(profile?.role || '') && (
                        <Link href="/dashboard/kanban" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                            <LayoutDashboard className="h-5 w-5" />
                            Tablero Kanban
                        </Link>
                    )}

                    {/* Customers: Owner, Manager, Head Tech, Reception (Sales has own view) */}
                    {['owner', 'manager', 'head_technician', 'receptionist'].includes(profile?.role || '') && (
                        <Link href="/customers" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                            <Users className="h-5 w-5" />
                            Clientes
                        </Link>
                    )}

                    {/* Inventory: Owner, Manager, Head Tech, Reception, Warehouse, Technician */}
                    {['owner', 'manager', 'head_technician', 'receptionist', 'warehouse_keeper', 'technician'].includes(profile?.role || '') && (
                        <Link href="/inventory" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                            <Package className="h-5 w-5" />
                            Inventario
                        </Link>
                    )}

                    {/* --- ADMIN MODULES --- */}

                    {/* Finance: Owner, Manager, Reception */}
                    {['owner', 'manager', 'receptionist'].includes(profile?.role || '') && (
                        <Link href="/finance" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                            <DollarSign className="h-5 w-5" />
                            Finanzas
                        </Link>
                    )}

                    {/* Punto de Venta: For Admin & Reception access */}
                    {['owner', 'manager', 'receptionist'].includes(profile?.role || '') && (
                        <Link href="/pos" className="flex items-center gap-3 px-4 py-3 text-emerald-400 font-bold bg-emerald-950/30 hover:bg-emerald-900/50 rounded-md transition-colors border border-emerald-900/50 mt-2">
                            <DollarSign className="h-5 w-5" />
                            Punto de Venta
                        </Link>
                    )}

                    {/* Metrics & Analytics: Owner, Manager, Head Tech */}
                    {['owner', 'manager', 'head_technician'].includes(profile?.role || '') && (
                        <>
                            <Link href="/sales-metrics" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                                <BarChart2 className="h-5 w-5" />
                                Métricas Ventas
                            </Link>

                            <Link href="/analytics" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                                <BarChart2 className="h-5 w-5" />
                                Analítica Gral
                            </Link>

                            <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                                <Settings className="h-5 w-5" />
                                Configuración
                            </Link>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <Users className="h-5 w-5" />
                        Mi Perfil
                    </Link>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                <header className="bg-background border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="font-semibold text-foreground">Panel de Control</h2>
                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <Link href="/profile" title="Mi Perfil">
                            {profile?.avatar_url ? (
                                <div className="h-8 w-8 rounded-full overflow-hidden border border-indigo-200">
                                    <Image
                                        src={profile.avatar_url}
                                        alt="Avatar"
                                        width={32}
                                        height={32}
                                        className="object-cover h-full w-full"
                                    />
                                </div>
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 hover:bg-indigo-200 transition-colors">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </Link>
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>

            {/* Realtime Notifications */}
            <FloatingNotification tenantId={profile?.tenant_id} />
        </div>
    )
}
