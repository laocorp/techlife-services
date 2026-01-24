'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function RevenueChart({ data }: { data: any[] }) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Ingresos (Últimos 7 días)</CardTitle>
                <CardDescription>
                    Total recaudado en caja por día.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
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
                            formatter={(value: any) => [`$${value}`, 'Ingresos']}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Bar
                            dataKey="revenue"
                            fill="#4f46e5"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
