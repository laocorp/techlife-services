'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, Clock, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SalesAgentOrdersViewProps {
    orders: any[]
    stats: {
        today: number
        month: number
        totalOrders: number
        pendingPayment: number
    }
}

export default function SalesAgentOrdersView({ orders, stats }: SalesAgentOrdersViewProps) {
    if (!orders || orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <ShoppingCart className="w-16 h-16 text-muted-foreground/50" />
                <h2 className="text-xl font-semibold">Aún no has realizado ventas</h2>
                <p className="text-muted-foreground">Comienza agregando productos al carrito.</p>
                <Link href="/sales/catalog">
                    <Button>Ir al Catálogo</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.today.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ventas Mes</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.month.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pendientes Pago</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {stats.pendingPayment}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Orders List */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Órdenes</CardTitle>
                    <CardDescription>Lista de tus ventas recientes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3">Orden</th>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Cliente</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-center">Estado</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-muted-foreground">
                                {orders.map((order) => (
                                    <tr key={order.id} className="bg-card hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                            #{order.ticket_number}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {new Date(order.created_at).toLocaleDateString()}
                                            <span className="text-xs text-muted-foreground ml-1">
                                                {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 max-w-[200px] truncate" title={order.customer?.full_name}>
                                            <div className="font-medium text-foreground">{order.customer?.full_name || 'Cliente Mostrador'}</div>
                                            <div className="text-xs">{order.customer?.email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-foreground">
                                            ${order.total?.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant={
                                                order.status === 'completed' || order.status === 'delivered' ? 'default' :
                                                    order.status === 'pending_payment' ? 'destructive' :
                                                        order.status === 'in_progress' ? 'secondary' : 'outline'
                                            } className="capitalize shadow-none">
                                                {order.status === 'pending_payment' ? 'Pend. Pago' :
                                                    order.status === 'in_progress' ? 'En Taller' :
                                                        order.status === 'delivered' ? 'Entregado' : order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <Button variant="ghost" size="sm" asChild>
                                                {/* Link to detail page if it exists later, or open modal */}
                                                <Link href={`/sales/orders/${order.id}`}>Ver</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
