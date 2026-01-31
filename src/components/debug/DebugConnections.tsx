'use client'

import { useEffect, useState } from 'react'
import { debugConnectionStateAction } from '@/lib/actions/debug'

export default function DebugConnections() {
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        debugConnectionStateAction().then(setData)
    }, [])

    if (!data) return <div className="p-4 bg-gray-100 text-xs">Cargando diagnóstico...</div>

    return (
        <div className="p-4 bg-slate-900 text-green-400 text-xs font-mono rounded-lg mb-8 overflow-auto max-h-96">
            <h3 className="font-bold text-white mb-2">DIAGNÓSTICO DE CONEXIONES</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}
