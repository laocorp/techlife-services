'use client'

import Link from 'next/link'
import Image from 'next/image'
import { NotificationBell } from '@/components/common/NotificationBell'

export function MobileHeader() {
    return (
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-xl shadow-lg shadow-indigo-200">
                    <Image
                        src="/logo_transparent.png"
                        alt="Logo"
                        width={24}
                        height={24}
                        className="brightness-0 invert"
                    />
                </div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-none">
                    TechLife<span className="text-indigo-600">Hub</span>
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <NotificationBell />
                <Link href="/profile" className="h-10 w-10 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center text-indigo-600 font-bold overflow-hidden active:scale-90 transition-transform">
                    <span className="text-sm">DA</span>
                </Link>
            </div>
        </header>
    )
}
