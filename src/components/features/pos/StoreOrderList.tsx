'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Printer } from 'lucide-react'
import { useState } from 'react'
import { OrderNotificationDialog } from '@/components/features/orders/OrderNotificationDialog'
import { Button } from '@/components/ui/button'

interface StoreOrderListProps {
    orders: any[]
}

export default function StoreOrderList({ orders }: StoreOrderListProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

    return (
        <>
            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Venta</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado Pago</TableHead>
                            <TableHead>Estado Pedido</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                    No hay ventas registradas aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedOrderId(order.id)}>
                                    <TableCell className="font-mono text-xs">
                                        {order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-bold text-green-600">
                                        ${order.total_amount?.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'pending' ? 'secondary' : 'destructive'}>
                                            {order.payment_status === 'paid' ? 'Pagado' : order.payment_status === 'pending' ? 'Pendiente' : order.payment_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {order.status === 'delivered' ? 'Completado' : order.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-indigo-600"
                                                onClick={() => setSelectedOrderId(order.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <a
                                                href={`/print/sales/${order.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 h-8 w-8 text-slate-500"
                                            >
                                                <Printer className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedOrderId && (
                <OrderNotificationDialog
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </>
    )
}
