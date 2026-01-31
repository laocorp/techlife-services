'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ExternalLink, MapPin, ShoppingBag, FileText, Truck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ConsumerOrderDetailsDialogProps {
    orderId: string | null
    onClose: () => void
}

export function ConsumerOrderDetailsDialog({ orderId, onClose }: ConsumerOrderDetailsDialogProps) {
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)
    const [shippingProofUrl, setShippingProofUrl] = useState<string | null>(null)
    const supabase = createClient()

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

    if (!orderId) return null

    return (
        <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-slate-900 border-slate-200">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
                        <ShoppingBag className="h-6 w-6 text-indigo-600" />
                        Tu Orden #{order?.id?.slice(0, 8)}
                    </DialogTitle>
                    <div className='sr-only'>Detalles completos de tu orden de compra</div>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        {/* Status Bar */}
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Estado</p>
                                <div className="flex gap-2 flex-wrap">
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente Pago'}
                                    </Badge>
                                    <Badge variant="outline" className="mt-1">
                                        {order.status === 'shipped' ? 'Enviado' : order.status === 'delivered' ? 'Entregado' : order.status === 'pending' ? 'En Proceso' : order.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</p>
                                <p className="text-lg font-bold text-slate-900">${order.total_amount?.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Shipping Info - Highlighted if Shipped */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <Truck className="h-4 w-4" /> Datos de Envío
                                </h4>
                                <div className="text-sm space-y-1 text-slate-700">
                                    <p><span className="font-semibold text-slate-900">Dirección:</span></p>
                                    <p className="bg-slate-50 p-2 rounded border border-slate-100">{order.shipping_address?.address}</p>
                                    <p className="text-slate-600">{order.shipping_address?.city}, {order.shipping_address?.state}</p>

                                    {order.status === 'shipped' && (
                                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-100 text-blue-900">
                                            <p className="font-bold mb-1 border-b border-blue-200 pb-1">Paquete Enviado:</p>
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
                                <h4 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                                    <FileText className="h-4 w-4" /> Pago
                                </h4>
                                <div className="text-sm space-y-2 text-slate-700">
                                    <p>Método: <span className="font-medium">{order.shipping_address?.payment_method === 'transfer' ? 'Transferencia Bancaria' : 'Otro'}</span></p>

                                    {order.payment_proof_url && (
                                        <div className="mt-2">
                                            <p className="text-xs text-slate-500 mb-1 font-semibold">Comprobante subido:</p>
                                            <div className="h-20 w-32 bg-slate-100 rounded border overflow-hidden relative group">
                                                {paymentProofUrl ? (
                                                    <a href={paymentProofUrl} target="_blank" rel="noreferrer">
                                                        <img src={paymentProofUrl} className="h-full w-full object-cover" alt="Comprobante Pago" />
                                                    </a>
                                                ) : <div className="h-full w-full animate-pulse bg-slate-200" />}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Proof Image */}
                        {order.status === 'shipped' && shippingProofUrl && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <p className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> Foto / Comprobante de la Guía
                                </p>
                                <div className="relative aspect-video max-h-[300px] bg-white rounded border overflow-hidden group">
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
                            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4" /> Productos
                            </h4>
                            <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                        <tr>
                                            <th className="p-3">Producto</th>
                                            <th className="p-3 text-center">Cant</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {order.items?.map((item: any, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50 text-slate-800">
                                                <td className="p-3 font-medium text-slate-900">{item.products?.name}</td>
                                                <td className="p-3 text-center text-slate-700">{item.quantity}</td>
                                                <td className="p-3 text-right font-semibold text-slate-900">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={onClose}>Cerrar</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">Orden no encontrada</div>
                )}
            </DialogContent>
        </Dialog>
    )
}
