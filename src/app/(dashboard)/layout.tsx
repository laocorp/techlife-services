import Link from 'next/link'
import { LayoutDashboard, Users, Wrench, Package, Settings, LogOut, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { NotificationsBell } from '@/components/common/NotificationsBell'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold tracking-tight">TechLife<span className="text-indigo-400">Service</span></h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <Wrench className="h-5 w-5" />
                        Órdenes
                    </Link>

                    <Link href="/customers" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <Users className="h-5 w-5" />
                        Clientes
                    </Link>

                    <Link href="/inventory" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <Package className="h-5 w-5" />
                        Inventario
                    </Link>

                    <Link href="/finance" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <DollarSign className="h-5 w-5" />
                        Finanzas
                    </Link>

                    <Link href="/pos" className="flex items-center gap-3 px-4 py-3 text-emerald-400 font-bold bg-emerald-950/30 hover:bg-emerald-900/50 rounded-md transition-colors border border-emerald-900/50 mt-2">
                        <DollarSign className="h-5 w-5" />
                        Punto de Venta
                    </Link>

                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-md transition-colors">
                        <Settings className="h-5 w-5" />
                        Configuración
                    </Link>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <form action="/auth/signout" method="post">
                        <button className="flex w-full items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors">
                            <LogOut className="h-5 w-5" />
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                <header className="bg-white border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="font-semibold text-slate-800">Panel de Control</h2>
                    <div className="flex items-center gap-4">
                        <NotificationsBell />
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                            {user.email?.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
