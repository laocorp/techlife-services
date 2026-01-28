'use client'

import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

interface TechnicianChartProps {
    data: {
        name: string
        completed: number
    }[]
}

export default function TechnicianChart({ data }: TechnicianChartProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg" />

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-slate-500 text-sm">
                No hay datos de técnicos
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" name="Órdenes Completadas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    )
}
