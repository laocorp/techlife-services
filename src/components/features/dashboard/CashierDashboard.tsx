'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { confirmPaymentAction, cancelOrderAction } from '@/lib/actions/orders'
import { toast } from '@/components/ui/use-toast'
import { DollarSign, Clock, User, Hash, Receipt, Ban } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface PendingOrder {
    id: string
    created_at: string
    customer: { full_name: string; email?: string }
    items: { quantity: number; unit_price: number; product: { name: string } }[]
    sales_rep: { full_name: string; sales_code?: string }
    notes?: string
    description_problem?: string
}

interface CashierDashboardProps {
    pendingOrders: PendingOrder[]
}

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function CashierDashboard({ pendingOrders }: CashierDashboardProps) {
    const router = useRouter()
    const supabase = createClient()
    const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [reference, setReference] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const channel = supabase
            .channel('cashier_orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'service_orders'
            }, () => {
                router.refresh()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, supabase])

    const calculateTotal = (order: PendingOrder) => {
        return order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
    }

    const handleConfirmPayment = async () => {
        if (!selectedOrder) return
        setLoading(true)

        const res = await confirmPaymentAction(selectedOrder.id, paymentMethod, reference)
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Pago Confirmado', description: 'La orden ha sido procesada exitosamente.' })
            setSelectedOrder(null)
            // Ideally force refresh or reload
            window.location.reload()
        }
    }


    const handleCancelOrder = async () => {
        if (!selectedOrder) return
        if (!confirm('¿Estás seguro de que deseas anular esta orden? El stock será devuelto al inventario.')) return

        setLoading(true)
        const res = await cancelOrderAction(selectedOrder.id, "Anulado en Caja")
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Orden Anulada', description: 'El stock ha sido restaurado correctamente.' })
            setSelectedOrder(null)
            // Realtime listener will handle refresh
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Caja / POS</h1>
                    <p className="text-muted-foreground">Gestiona los pagos pendientes y confirma ventas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingOrders.map(order => (
                    <Card key={order.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <Badge variant="outline" className="font-mono text-xs">#{order.id.slice(0, 8)}</Badge>
                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                                    Pendiente Pago
                                </Badge>
                            </div>
                            <CardTitle className="text-lg mt-2">{order.customer.full_name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                <User className="w-3 h-3" /> Vendedor: {order.sales_rep?.full_name || 'Desconocido'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="text-sm text-muted-foreground line-clamp-2 bg-muted p-2 rounded-md">
                                    {order.items.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(new Date(order.created_at), "d MMM, HH:mm", { locale: es })}
                                    </div>
                                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                        ${calculateTotal(order).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {pendingOrders.length === 0 && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed rounded-lg">
                        <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No hay pagos pendientes</h3>
                        <p className="text-muted-foreground">Las órdenes listas para pagar aparecerán aquí.</p>
                    </div>
                )}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Confirmar Pago</DialogTitle>
                        <DialogDescription>
                            Orden #{selectedOrder?.id.slice(0, 8)} - {selectedOrder?.customer.full_name}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-4 py-4">
                            {/* Summary Table */}
                            <div className="border rounded-md p-3 bg-muted/20 space-y-2 max-h-[150px] overflow-y-auto">
                                {selectedOrder.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.product?.name}</span>
                                        <span className="font-mono">${(item.quantity * item.unit_price).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="border-t pt-2 flex justify-between font-bold text-base">
                                    <span>Total a Pagar</span>
                                    <span>${calculateTotal(selectedOrder).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="grid gap-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right text-sm font-medium">Método</label>
                                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Efectivo 💵</SelectItem>
                                            <SelectItem value="card">Tarjeta / POS 💳</SelectItem>
                                            <SelectItem value="transfer">Transferencia 🏦</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {paymentMethod !== 'cash' && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <label className="text-right text-sm font-medium">Ref / #</label>
                                        <Input
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="Número de operación (opcional)"
                                            className="col-span-3"
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedOrder.notes && (
                                <div className="text-xs text-muted-foreground italic bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded">
                                    Nota: {selectedOrder.notes}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <div className="flex justify-between w-full">
                            <Button variant="destructive" onClick={handleCancelOrder} disabled={loading} className="gap-2">
                                <Ban className="w-4 h-4" /> Anular
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                                <Button onClick={handleConfirmPayment} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                                    {loading ? 'Procesando...' : 'Confirmar Pago'}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
