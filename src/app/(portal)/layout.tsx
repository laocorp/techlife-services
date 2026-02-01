import Link from 'next/link'
import Image from 'next/image'

import { Wrench, LogOut, Package, Monitor, Store, Car, MapPin, ShoppingCart, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Button } from '@/components/ui/button'
import { portalLogoutAction } from '@/lib/actions/portal-auth'
import { CartProvider } from '@/context/cart-context'
import CartIndicator from '@/components/features/store/CartIndicator'
import { NotificationBell } from '@/components/common/NotificationBell'

export const metadata = {
    title: {
        template: '%s | Portal Clientes',
        default: 'Portal Clientes | TechLife Service',
    },
    description: 'Accede al estado de tus reparaciones, historial de servicios y más en el Portal de Clientes de TechLife.',
}

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col bg-slate-50">
                {/* Public Header */}
                <header className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
                    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                        <Link href="/portal" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                            <div className="bg-transparent">
                                <Image
                                    src="/logo_icon.png"
                                    alt="TechLife Portal"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                            TechLife<span className="text-indigo-600">Portal</span>
                        </Link>

                        <nav className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <Link href="/portal/dashboard" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                                        <Store className="h-4 w-4" />
                                        <span className="hidden sm:inline">Hub</span>
                                    </Link>
                                    <Link href="/portal/garage" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                                        <Car className="h-4 w-4" />
                                        <span className="hidden sm:inline">Mi Garaje</span>
                                    </Link>
                                    <Link href="/portal/profile" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span className="hidden sm:inline">Mi Perfil</span>
                                    </Link>
                                    <Link href="/portal/marketplace" className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span className="hidden sm:inline">Marketplace</span>
                                    </Link>

                                    <NotificationBell />
                                    <CartIndicator />

                                    <div className="h-4 w-px bg-slate-200 mx-1 sm:mx-2" />
                                    <form action={portalLogoutAction}>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                            <LogOut className="h-4 w-4 mr-1" />
                                            <span className="hidden sm:inline">Salir</span>
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <Link href="/portal/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                                    Iniciar Sesión
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>

                <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm no-print">
                    <p>&copy; {new Date().getFullYear()} TechLife Service. Portal de Clientes.</p>
                </footer>
            </div>
        </CartProvider>
    )
}
