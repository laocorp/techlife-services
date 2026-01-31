'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Clock, CheckCircle, Truck } from 'lucide-react'
import { ConsumerOrderDetailsDialog } from './ConsumerOrderDetailsDialog'
import { useSearchParams } from 'next/navigation'

interface PurchaseOrder {
    id: string
    created_at: string
    total_amount: number
    status: string
    payment_status: string
}

interface PurchaseHistorySectionProps {
    orders: PurchaseOrder[]
}

export default function PurchaseHistorySection({ orders }: PurchaseHistorySectionProps) {
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const searchParams = useSearchParams()

    useEffect(() => {
        // Auto-open from URL param if present
        const orderIdParam = searchParams.get('order_id')
        if (orderIdParam) {
            setSelectedOrderId(orderIdParam)
        }
    }, [searchParams])

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800">Mis Compras</h2>
            </div>

            {orders && orders.length > 0 ? (
                <div className="space-y-3">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h4 className="font-bold text-slate-900">Orden #{order.id.slice(0, 8)}</h4>
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente Pago'}
                                    </Badge>

                                    {order.status === 'shipped' && (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            <Truck className="h-3 w-3 mr-1" /> Enviado
                                        </Badge>
                                    )}
                                    {order.status === 'delivered' && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Entregado
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500">
                                    {new Date(order.created_at).toLocaleDateString()} &bull; Total: <span className="font-semibold text-slate-900">${order.total_amount?.toFixed(2)}</span>
                                </p>
                            </div>

                            <Button variant="outline" size="sm" onClick={() => setSelectedOrderId(order.id)}>
                                <Eye className="h-4 w-4 mr-2" /> Ver Detalle
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border border-dashed rounded-lg p-8 text-center text-slate-500">
                    No has realizado compras recientes.
                </div>
            )}

            <ConsumerOrderDetailsDialog
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
            />
        </section>
    )
}
