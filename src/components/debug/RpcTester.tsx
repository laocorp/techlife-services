'use client'

import { useEffect, useState } from 'react'
import { debugRpcAction } from '@/lib/actions/debug-rpc'

export default function RpcTester() {
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        debugRpcAction().then(setData)
    }, [])

    if (!data) return <div className="p-4 bg-gray-100 text-xs">Diagnósticando RPC...</div>

    return (
        <div className="p-4 bg-black text-green-400 text-xs font-mono rounded-lg mb-8 overflow-auto max-h-96">
            <h3 className="font-bold text-white mb-2">DIAGNÓSTICO RPC FINAL</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}
