'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
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
            <div className="min-h-screen flex flex-col bg-background">
                <header className="border-b sticky top-0 bg-background z-50 border-border shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <Link href="/store" className="flex items-center gap-2 font-bold text-xl text-foreground">
                            <div className="bg-transparent">
                                <Image
                                    src="/logo_transparent.png"
                                    alt="TechLife Store"
                                    width={32}
                                    height={32}
                                    className="object-contain"
                                />
                            </div>
                            TechLife <span className="text-indigo-600 dark:text-indigo-400">Store</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8">
                            <Link href="/store" className="text-sm font-medium text-muted-foreground hover:text-primary">
                                Catálogo
                            </Link>
                            <Link href="/portal/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
                                Hub
                            </Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            <Link href="/store/cart">
                                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                                    <ShoppingCart className="h-5 w-5" />
                                    <CartBadge />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>

                <footer className="bg-muted/50 border-t border-border py-12">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-muted-foreground text-sm">
                            &copy; {new Date().getFullYear()} TechLife Service. Todos los derechos reservados.
                        </p>
                    </div>
                </footer>
            </div>
        </CartProvider>
    )
}
