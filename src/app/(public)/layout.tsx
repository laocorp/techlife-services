'use client'

import Link from 'next/link'
import { ShoppingCart, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CartProvider, useCart } from '@/context/cart-context'

function CartBadge() {
    const { totalItems } = useCart()

    if (totalItems === 0) return null

    return (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center animate-in zoom-in">
            {totalItems}
        </span>
    )
}

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CartProvider>
            <div className="min-h-screen flex flex-col bg-white">
                <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link href="/store" className="flex items-center gap-2 font-bold text-xl text-slate-900">
                            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                                T
                            </div>
                            TechLife <span className="text-slate-500 font-normal">Store</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/store" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                                Catálogo
                            </Link>
                            {/* <Link href="/track" className="text-sm font-medium text-slate-700 hover:text-indigo-600">
                                Rastreo
                            </Link> */}
                        </nav>

                        <div className="flex items-center gap-4">
                            <Link href="/store/cart">
                                <Button variant="ghost" size="icon" className="relative text-slate-700 hover:text-indigo-600">
                                    <ShoppingCart className="h-5 w-5" />
                                    <CartBadge />
                                </Button>
                            </Link>

                            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                            <Link href="/portal/login">
                                <Button variant="ghost" size="sm" className="hidden sm:flex text-slate-600">
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Portal
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>

                <footer className="bg-slate-50 border-t border-slate-200 py-12">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-slate-500 text-sm">
                            &copy; {new Date().getFullYear()} TechLife Service. Todos los derechos reservados.
                        </p>
                    </div>
                </footer>
            </div>
        </CartProvider>
    )
}
