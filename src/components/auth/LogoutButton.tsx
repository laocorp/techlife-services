'use client'

import { LogOut } from 'lucide-react'

export default function LogoutButton() {
    return (
        <a
            href="/auth/signout"
            className="flex w-full items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
            <LogOut className="h-5 w-5" />
            Cerrar Sesión
        </a>
    )
}
