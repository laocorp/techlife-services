'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function RevenueChart({ data }: { data: any[] }) {
    return (
        <div className="col-span-1">
            {/* Header removed as it is handled by parent */}
            <div className="pl-2 pt-4">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                            itemStyle={{ color: 'hsl(var(--foreground))' }}
                            formatter={(value: any) => [`$${value}`, 'Ingresos']}
                            cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
