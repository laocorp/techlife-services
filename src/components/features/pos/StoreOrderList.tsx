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
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { OrderNotificationDialog } from '@/components/features/orders/OrderNotificationDialog'
import { Button } from '@/components/ui/button'

interface StoreOrderListProps {
    orders: any[]
}

export default function StoreOrderList({ orders }: StoreOrderListProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const searchParams = useSearchParams()
    const router = useRouter()

    // Open modal from URL query parameter (e.g., from notification link)
    useEffect(() => {
        const orderIdFromUrl = searchParams.get('order')
        if (orderIdFromUrl) {
            setSelectedOrderId(orderIdFromUrl)
            // Clean URL without refreshing page
            router.replace('/pos/history', { scroll: false })
        }
    }, [searchParams, router])

    const handleCloseModal = () => {
        setSelectedOrderId(null)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            'pending': { label: 'En Proceso', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' },
            'shipped': { label: 'Enviado', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700' },
            'delivered': { label: 'Entregado', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700' },
        }
        const config = statusConfig[status] || { label: status, className: 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300' }
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <TableHead className="text-slate-600 dark:text-slate-300">ID Venta</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300">Fecha</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300">Monto</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300">Estado Pago</TableHead>
                            <TableHead className="text-slate-600 dark:text-slate-300">Estado Pedido</TableHead>
                            <TableHead className="w-[100px] text-right text-slate-600 dark:text-slate-300">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow className="border-slate-200 dark:border-slate-700">
                                <TableCell colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                    No hay ventas registradas aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700" onClick={() => setSelectedOrderId(order.id)}>
                                    <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                        {order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell className="text-slate-700 dark:text-slate-300">
                                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-bold text-green-600 dark:text-green-400">
                                        ${order.total_amount?.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.payment_status === 'paid' ? 'default' : order.payment_status === 'pending' ? 'secondary' : 'destructive'}>
                                            {order.payment_status === 'paid' ? 'Pagado' : order.payment_status === 'pending' ? 'Pendiente' : order.payment_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(order.status)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                onClick={() => setSelectedOrderId(order.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <a
                                                href={`/print/sales/${order.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-700 h-8 w-8 text-slate-500 dark:text-slate-400"
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
                    onClose={handleCloseModal}
                />
            )}
        </>
    )
}
