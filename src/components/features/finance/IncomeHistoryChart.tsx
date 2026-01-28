'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'

interface IncomeHistoryChartProps {
    data: {
        date: string
        services: number
        sales: number
        total: number
    }[]
}

export default function IncomeHistoryChart({ data }: IncomeHistoryChartProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-lg" />

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed bg-slate-50 text-sm text-slate-500">
                No hay datos para el periodo seleccionado.
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorServices" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        formatter={(value: number | undefined) => [`$${(value || 0).toFixed(2)}`, '']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey="services"
                        name="Servicios (Taller)"
                        stackId="1"
                        stroke="#8884d8"
                        fill="url(#colorServices)"
                    />
                    <Area
                        type="monotone"
                        dataKey="sales"
                        name="Ventas POS/Web"
                        stackId="1"
                        stroke="#82ca9d"
                        fill="url(#colorSales)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
