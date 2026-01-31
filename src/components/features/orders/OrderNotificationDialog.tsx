'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, ExternalLink, MapPin, User, Phone, Mail, FileText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface OrderNotificationDialogProps {
    orderId: string | null
    onClose: () => void
}

export function OrderNotificationDialog({ orderId, onClose }: OrderNotificationDialogProps) {
    const [isShipping, setIsShipping] = useState(false)
    const [carrier, setCarrier] = useState('')
    const [trackingCode, setTrackingCode] = useState('')
    const [shippingFile, setShippingFile] = useState<File | null>(null)
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [confirming, setConfirming] = useState(false)
    const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null) // State for signed URL
    const [shippingProofUrl, setShippingProofUrl] = useState<string | null>(null) // State for signed URL
    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

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

    const handleConfirmPayment = async () => {
        if (!order) return
        setConfirming(true)

        // 1. Update Payment Status
        const { error } = await supabase
            .from('ecommerce_orders')
            .update({
                payment_status: 'paid',
                status: 'pending'
            })
            .eq('id', order.id)

        if (error) {
            console.error('Error updating order:', error)
            toast({ title: 'Error', description: 'No se pudo confirmar el pago.', variant: 'destructive' })
            setConfirming(false)
            return
        }

        // 2. Notify Customer
        if (order.user_id) {
            await supabase.from('notifications').insert({
                user_id: order.user_id,
                title: 'Pago Confirmado',
                message: `Hemos recibido tu pago para la Orden #${order.id.slice(0, 8)}. Tu pedido está en preparación.`,
                type: 'success',
                link: '/portal/dashboard'
            })
        }

        toast({ title: 'Pago Confirmado', description: 'La orden ha sido actualizada.' })
        setConfirming(false)
        fetchOrder(order.id) // Refresh local state
        router.refresh()
    }

    const handleRegisterShipping = async () => {
        console.log('Registering shipping...', { carrier, trackingCode, hasFile: !!shippingFile })
        if (!order || !carrier || !trackingCode) {
            toast({ title: 'Datos incompletos', description: 'Ingresa transportista y guía.', variant: 'destructive' })
            return
        }
        setConfirming(true)

        let proofPath = null

        // 1. Upload File if exists
        if (shippingFile) {
            const ext = shippingFile.name.split('.').pop()
            const fileName = `${order.id}_shipping_${Date.now()}.${ext}`
            console.log('Uploading file:', fileName)

            const { error: uploadError, data: uploadData } = await supabase.storage
                .from('shipping-proofs')
                .upload(fileName, shippingFile, {
                    cacheControl: '3600',
                    upsert: false
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                toast({ title: 'Error al subir imagen', description: uploadError.message, variant: 'destructive' })
                setConfirming(false)
                return
            }
            proofPath = fileName
        }

        // 2. Update Order
        const { error } = await supabase
            .from('ecommerce_orders')
            .update({
                status: 'shipped',
                shipping_carrier: carrier,
                shipping_tracking: trackingCode,
                shipping_proof_url: proofPath,
                shipped_at: new Date().toISOString()
            })
            .eq('id', order.id)

        if (error) {
            console.error('Update error:', error)
            toast({ title: 'Error al actualizar', description: error.message, variant: 'destructive' })
            setConfirming(false)
            return
        }

        // 3. Notify Customer
        if (order.user_id) {
            await supabase.from('notifications').insert({
                user_id: order.user_id,
                title: 'Pedido Enviado',
                message: `Tu pedido #${order.id.slice(0, 8)} ha sido enviado por ${carrier}. Guía: ${trackingCode}.`,
                type: 'success',
                link: `/portal/dashboard?order_id=${order.id}`
            })
        }

        toast({ title: 'Envío Registrado', description: 'El cliente ha sido notificado.' })
        setConfirming(false)
        setIsShipping(false)
        fetchOrder(order.id)
        router.refresh()
    }

    if (!orderId) return null

    return (
        <Dialog open={!!orderId} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ShoppingBagIcon className="h-6 w-6 text-indigo-600" />
                        Orden #{order?.id?.slice(0, 8)}
                    </DialogTitle>
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
                                <div className="flex gap-2">
                                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                                        {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                                    </Badge>
                                    {order.status === 'shipped' && (
                                        <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 border-blue-200">Enviado</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total</p>
                                <p className="text-lg font-bold text-slate-900">${order.total_amount?.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Order Details (Hide if showing shipping form) */}
                        {!isShipping ? (
                            <>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                                            <User className="h-4 w-4" /> Cliente
                                        </h4>
                                        <div className="text-sm space-y-2">
                                            <p><span className="font-medium">Nombre:</span> {order.shipping_address?.fullname}</p>
                                            <p className="flex items-center gap-2"><Mail className="h-3 w-3 text-slate-400" /> {order.shipping_address?.email}</p>
                                            <p className="flex items-center gap-2"><Phone className="h-3 w-3 text-slate-400" /> {order.shipping_address?.phone}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="font-semibold text-slate-900 flex items-center gap-2 border-b pb-2">
                                            <MapPin className="h-4 w-4" /> Envío
                                        </h4>
                                        <div className="text-sm space-y-1">
                                            <p>{order.shipping_address?.address}</p>
                                            <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                                            {order.status === 'shipped' && (
                                                <div className="mt-2 text-xs space-y-2">
                                                    <div className="p-2 bg-blue-50 rounded border border-blue-100 text-blue-800">
                                                        <p className="font-bold">Datos de Rastreo:</p>
                                                        <p>Empresa: {order.shipping_carrier}</p>
                                                        <p>Guía: {order.shipping_tracking}</p>
                                                    </div>

                                                    {shippingProofUrl && (
                                                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                                            <p className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                                                <FileText className="h-3 w-3" /> Comprobante de Envío
                                                            </p>
                                                            <div className="relative aspect-video bg-white rounded border overflow-hidden group">
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
                                                                    <ExternalLink className="h-4 w-4 mr-2" /> Abrir / Descargar
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <FileText className="h-4 w-4" /> Productos ({order.items?.length})
                                    </h4>
                                    <div className="rounded-md border border-slate-200 overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-medium">
                                                <tr>
                                                    <th className="p-3">Producto</th>
                                                    <th className="p-3 text-center">Cant</th>
                                                    <th className="p-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {order.items?.map((item: any, i: number) => (
                                                    <tr key={i}>
                                                        <td className="p-3">{item.products?.name}</td>
                                                        <td className="p-3 text-center">{item.quantity}</td>
                                                        <td className="p-3 text-right">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {order.payment_proof_url && (
                                    <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                                        <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Comprobante de Pago
                                        </h4>
                                        <div className="aspect-video relative bg-white rounded border border-indigo-200 overflow-hidden group">
                                            {paymentProofUrl ? (
                                                <>
                                                    <img src={paymentProofUrl} alt="Comprobante" className="object-contain w-full h-full" />
                                                    <a href={paymentProofUrl} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                                        <ExternalLink className="h-6 w-6 mr-2" /> Ver Original
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Shipping Form
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                    <TruckIcon className="h-5 w-5 text-indigo-600" />
                                    Registrar Envío
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Empresa de Transporte</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="Ej: Servientrega, Uber Flash..."
                                            value={carrier}
                                            onChange={(e) => setCarrier(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Número de Guía / Tracking Link</label>
                                        <input
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            placeholder="Ej: 1234567890"
                                            value={trackingCode}
                                            onChange={(e) => setTrackingCode(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700">Comprobante / Foto Guía (Opcional)</label>
                                        <input
                                            type="file"
                                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            accept="image/*"
                                            onChange={(e) => setShippingFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" onClick={() => setIsShipping(false)}>Cancelar</Button>
                                    <Button onClick={handleRegisterShipping} disabled={confirming}>
                                        {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Confirmar Envío
                                    </Button>
                                </div>
                            </div>
                        )}

                        {!isShipping && (
                            <DialogFooter className="gap-2 sm:justify-between items-center border-t pt-4">
                                <Button variant="ghost" onClick={onClose}>Cerrar</Button>
                                <div className="flex gap-2">
                                    {/* Action Buttons */}
                                    {order.payment_status === 'pending' && (
                                        <Button onClick={handleConfirmPayment} disabled={confirming} className="bg-green-600 hover:bg-green-700 text-white">
                                            {confirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Pago
                                        </Button>
                                    )}
                                    {order.payment_status === 'paid' && order.status !== 'shipped' && (
                                        <Button onClick={() => setIsShipping(true)} variant="secondary" className="border border-slate-300">
                                            <TruckIcon className="mr-2 h-4 w-4" /> Registrar Envío
                                        </Button>
                                    )}
                                </div>
                            </DialogFooter>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500">No se encontraron datos de la orden.</div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function TruckIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10 17h4V5H2v12h3" />
            <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" />
            <path d="M14 17h1" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    )
}

function ShoppingBagIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
    )
}
