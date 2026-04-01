'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Wrench, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function MobileNav() {
    const pathname = usePathname()

    const navItems = [
        {
            label: 'Inicio',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            label: 'Órdenes',
            href: '/orders',
            icon: Wrench,
        },
        {
            label: 'Clientes',
            href: '/customers',
            icon: Users,
        },
        {
            label: 'Perfil',
            href: '/profile',
            icon: User,
        },
    ]

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 flex items-center justify-around px-2 py-3 pb-6">
            {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-colors px-4 py-1 rounded-md",
                            isActive 
                                ? "text-indigo-400" 
                                : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
