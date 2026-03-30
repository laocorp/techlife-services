'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, ShoppingBag, Clock, Trophy, Medal, Award } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SalesMetric {
    sales_rep_id: string
    sales_rep: {
        full_name: string
        sales_code?: string
        avatar_url?: string
    }
    total_orders: number
    total_revenue: number
    completed_orders: number
    pending_orders: number
}

interface SalesHistoryItem {
    id: string
    created_at: string
    status: string
    description_problem?: string
    total: number
    order_value: number
    type: 'Venta' | 'Servicio'
    customer: { full_name: string }
    sales_rep: { full_name: string; sales_code?: string }
}

interface SalesMetricsViewProps {
    metrics: SalesMetric[]
    history?: SalesHistoryItem[]
}

export default function SalesMetricsView({ metrics, history }: SalesMetricsViewProps) {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    const totalRevenue = metrics.reduce((sum, m) => sum + m.total_revenue, 0)
    const totalOrders = metrics.reduce((sum, m) => sum + m.total_orders, 0)
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />
        if (index === 1) return <Medal className="w-5 h-5 text-slate-400" />
        if (index === 2) return <Award className="w-5 h-5 text-orange-600" />
        return null
    }

    const getRankBadge = (index: number) => {
        if (index === 0) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        if (index === 1) return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
        if (index === 2) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
        return 'bg-muted text-muted-foreground'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-primary" />
                        Métricas de Ventas
                    </h1>
                    <p className="text-muted-foreground mt-1">Desempeño y Transacciones en Caja</p>
                </div>

                {/* Date Filters */}
                {/* Note: In a real app, these inputs should push to URL searchParams to trigger server re-fetch */}
                <form className="flex gap-3 items-end">
                    <div>
                        <Label className="text-xs">Desde</Label>
                        <Input
                            type="date"
                            name="start"
                            defaultValue={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Hasta</Label>
                        <Input
                            type="date"
                            name="end"
                            defaultValue={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <button type="submit" hidden></button>
                </form>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Registrados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">${totalRevenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Dinero ingresado a caja</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Órdenes Totales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">{totalOrders}</div>
                                <p className="text-xs text-muted-foreground">Ventas y servicios</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ingreso Promedio</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <div className="text-3xl font-bold">${avgOrderValue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">De dinero real por orden</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Top Vendedores</CardTitle>
                        <CardDescription>Ranking por ingresos a caja</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {metrics.map((metric, index) => (
                                <div
                                    key={metric.sales_rep_id}
                                    className={`flex items-center justify-between p-3 rounded-lg border text-sm ${index < 3 ? 'bg-muted/30' : ''}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 w-6 text-center font-bold text-muted-foreground">
                                            #{index + 1}
                                        </div>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={metric.sales_rep?.avatar_url || ''} />
                                            <AvatarFallback className="text-xs">
                                                {metric.sales_rep?.full_name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="truncate">
                                            <div className="font-medium truncate">{metric.sales_rep?.full_name}</div>
                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                <span>{metric.total_orders} vtas</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                        ${metric.total_revenue.toFixed(2)}
                                    </div>
                                </div>
                            ))}
                            {metrics.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No hay datos</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed History Table */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Historial de Transacciones</CardTitle>
                        <CardDescription>Detalle de todas las ventas y su estatus de pago</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-2">Fecha</th>
                                        <th className="px-4 py-2">Tipo</th>
                                        <th className="px-4 py-2">Cliente</th>
                                        <th className="px-4 py-2">Vendedor</th>
                                        <th className="px-4 py-2 text-right">Valor Orden</th>
                                        <th className="px-4 py-2 text-right border-l">Ingresado</th>
                                        <th className="px-4 py-2 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {history?.map((order) => (
                                        <tr key={order.id} className="bg-card hover:bg-muted/50">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={order.type === 'Venta' ? 'default' : 'secondary'} className="text-xs">
                                                    {order.type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 max-w-[150px] truncate" title={order.customer?.full_name}>
                                                {order.customer?.full_name || 'Desconocido'}
                                            </td>
                                            <td className="px-4 py-3 max-w-[150px] truncate" title={order.sales_rep?.full_name}>
                                                {order.sales_rep?.full_name || 'General'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                ${(order.order_value || 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400 border-l">
                                                ${order.total.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant={
                                                    order.status === 'completed' || order.status === 'delivered' ? 'outline' :
                                                        order.status === 'pending_payment' ? 'destructive' : 'secondary'
                                                } className="text-[10px] capitalize">
                                                    {order.status === 'pending_payment' ? 'Pend. Pago' : order.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!history || history.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                No hay historial disponible.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
