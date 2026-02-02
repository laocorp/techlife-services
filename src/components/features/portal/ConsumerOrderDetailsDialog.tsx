'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ExternalLink, MapPin, ShoppingBag, FileText, Truck, CheckCircle, Package } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { confirmOrderReceived } from '@/lib/actions/order_confirmation'

interface ConsumerOrderDetailsDialogProps {
    orderId: string | null
    onClose: () => void
}

export function ConsumerOrderDetailsDialog({ orderId, onClose }: ConsumerOrderDetailsDialogProps) {
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [confirmingDelivery, setConfirmingDelivery] = useState(false)
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
    const [shippingProofUrl, setShippingProofUrl] = useState<string | null>(null)
    const supabase = createClient()
    const { toast } = useToast()

    useEffect(() => {
        if (orderId) {
            fetchOrder(orderId)
        }
    }, [orderId])

    const fetchOrder = async (id: string) => {
        setLoading(true)
        setPaymentProofUrl(null)
        setShippingProofUrl(null)

        const { data, error } = await supabase
            .from('ecommerce_orders')
            .select(`
                *,
                items:ecommerce_order_items(
                    quantity,
                    unit_price,
                    products(name)
                )
            `)
            .eq('id', id)
            .single()

        if (!error && data) {
            setOrder(data)

            // Generate Signed URL for Payment Proof
            if (data.payment_proof_url) {
                const { data: signedPayment } = await supabase.storage.from('payment-proofs').createSignedUrl(data.payment_proof_url, 3600)
                if (signedPayment) setPaymentProofUrl(signedPayment.signedUrl)
            }

            // Generate Signed URL for Shipping Proof
            if (data.shipping_proof_url) {
                const { data: signedShipping } = await supabase.storage.from('shipping-proofs').createSignedUrl(data.shipping_proof_url, 3600)
                if (signedShipping) setShippingProofUrl(signedShipping.signedUrl)
            }
        }
        setLoading(false)
    }

    const confirmDeliveryReceived = async () => {
        if (!order) return
        setConfirmingDelivery(true)

        try {
            console.log('📦 Calling server action for order:', order.id)

            // Call server action to confirm delivery and send notifications
            const result = await confirmOrderReceived(order.id)

            if (result.success) {
                console.log('✅ Server action completed successfully')
                setOrder({ ...order, status: 'delivered' })
                toast({
                    title: '¡Confirmado!',
                    description: 'Has confirmado la recepción de tu pedido. El taller ha sido notificado.',
                })
            } else {
                console.error('❌ Server action failed:', result.error)
                toast({
                    title: 'Error',
                    description: result.error || 'No se pudo confirmar la recepción.',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            console.error('Error confirming delivery:', error)
            toast({
                title: 'Error',
                description: 'No se pudo confirmar la recepción. Inténtalo de nuevo.',
                variant: 'destructive',
            })
        } finally {
            setConfirmingDelivery(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
            'pending': { label: 'En Proceso', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
            'shipped': { label: 'Enviado', variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
            'delivered': { label: 'Entregado', variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
        }
        const config = statusConfig[status] || { label: status, variant: 'outline' as const, className: '' }
        return <Badge className={config.className}>{config.label}</Badge>
    }

    if (!orderId) return null

    return (
        <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                        <ShoppingBag className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        Tu Orden #{order?.id?.slice(0, 8)}
                    </DialogTitle>
                    <div className='sr-only'>Detalles completos de tu orden de compra</div>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        {/* Status Bar */}
                        <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Estado</p>
                                <div className="flex gap-2 flex-wrap mt-1">
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente Pago'}
                                    </Badge>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">Total</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">${order.total_amount?.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Confirm Delivery Button - Show when shipped but not delivered */}
                        {order.status === 'shipped' && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                                        <Package className="h-5 w-5 text-green-600 dark:text-green-300" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-green-800 dark:text-green-200">¿Ya recibiste tu pedido?</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">Confirma la recepción para notificar al vendedor.</p>
                                    </div>
                                    <Button
                                        onClick={confirmDeliveryReceived}
                                        disabled={confirmingDelivery}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {confirmingDelivery ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                        )}
                                        Confirmar Recibido
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Delivered Confirmation Message */}
                        {order.status === 'delivered' && (
                            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-300" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-green-800 dark:text-green-200">¡Pedido entregado!</p>
                                        <p className="text-sm text-green-600 dark:text-green-400">Has confirmado la recepción de este pedido.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Shipping Info - Highlighted if Shipped */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <Truck className="h-4 w-4" /> Datos de Envío
                                </h4>
                                <div className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                                    <p><span className="font-semibold text-slate-900 dark:text-slate-100">Dirección:</span></p>
                                    <p className="bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-700">{order.shipping_address?.address}</p>
                                    <p className="text-slate-600 dark:text-slate-400">{order.shipping_address?.city}, {order.shipping_address?.state}</p>

                                    {(order.status === 'shipped' || order.status === 'delivered') && (
                                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-200">
                                            <p className="font-bold mb-1 border-b border-blue-200 dark:border-blue-700 pb-1">
                                                {order.status === 'delivered' ? '✓ Paquete Entregado' : 'Paquete Enviado'}
                                            </p>
                                            <div className="mt-2 space-y-1">
                                                <p><span className="font-semibold">Empresa:</span> {order.shipping_carrier || 'No especificada'}</p>
                                                <p><span className="font-semibold">Guía/Tracking:</span> {order.shipping_tracking || 'No disponible'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    <FileText className="h-4 w-4" /> Pago
                                </h4>
                                <div className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
                                    <p>Método: <span className="font-medium text-indigo-600 dark:text-indigo-400">{order.shipping_address?.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Otro'}</span></p>

                                    {order.payment_proof_url && (
                                        <div className="mt-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-semibold">Comprobante subido:</p>
                                            <div className="h-20 w-32 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                                                {paymentProofUrl ? (
                                                    <a href={paymentProofUrl} target="_blank" rel="noreferrer">
                                                        <img src={paymentProofUrl} className="h-full w-full object-cover" alt="Comprobante Pago" />
                                                    </a>
                                                ) : <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-700" />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Proof Image */}
                        {(order.status === 'shipped' || order.status === 'delivered') && shippingProofUrl && (
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Foto / Comprobante de la Guía
                                </p>
                                <div className="relative aspect-video max-h-[300px] bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 overflow-hidden group">
                                    <img
                                        src={shippingProofUrl}
                                        alt="Comprobante Envío"
                                        className="object-contain w-full h-full"
                                    />
                                    <a
                                        href={shippingProofUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity font-medium"
                                    >
                                        <ExternalLink className="h-5 w-5 mr-2" />
                                        Ver Imagen Completa
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Items */}
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" /> Productos
                            </h4>
                            <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-600">
                                        <tr>
                                            <th className="p-3">Producto</th>
                                            <th className="p-3 text-center">Cant</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                                        {order.items?.map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-800 dark:text-slate-200">
                                                <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{item.products?.name}</td>
                                                <td className="p-3 text-center text-slate-700 dark:text-slate-300">{item.quantity}</td>
                                                <td className="p-3 text-right font-semibold text-slate-900 dark:text-slate-100">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Cerrar</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">Orden no encontrada</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
