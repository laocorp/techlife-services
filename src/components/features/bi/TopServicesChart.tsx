'use client'

import { useState, useEffect } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface TopServicesChartProps {
    data: {
        name: string
        value: number
    }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function TopServicesChart({ data }: TopServicesChartProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[300px] w-full bg-slate-50 animate-pulse rounded-lg" />

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-slate-500 text-sm">
                No hay datos suficientes
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                layout="vertical"
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 40,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: number | undefined) => [value || 0, 'Cantidad']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
