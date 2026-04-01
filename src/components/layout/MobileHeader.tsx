'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NotificationBell } from '@/components/common/NotificationBell'

export function MobileHeader() {
    return (
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="flex items-center gap-2">
                <Image
                    src="/logo_transparent.png"
                    alt="Logo"
                    width={24}
                    height={24}
                    className="rounded-md"
                />
                <h1 className="text-lg font-bold text-white tracking-tight">
                    TechLife<span className="text-indigo-400">Hub</span>
                </h1>
            </div>
            <div className="flex items-center gap-3">
                <NotificationBell />
                <Link href="/profile" className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold overflow-hidden">
                    <span className="text-xs">MI</span>
                </Link>
            </div>
        </header>
    )
}
