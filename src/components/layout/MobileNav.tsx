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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50 flex items-center justify-around px-4 pb-4">
            {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = item.icon
 
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center gap-1.5 transition-all px-3 py-2 rounded-2xl active:scale-90",
                            isActive 
                                ? "text-indigo-600 bg-indigo-50" 
                                : "text-slate-400"
                        )}
                    >
                        <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                        <span className={cn("text-[10px] font-bold tracking-tight", isActive ? "opacity-100" : "opacity-80")}>
                            {item.label}
                        </span>
                    </Link>
                )
            })}
        </nav>
    )
}
