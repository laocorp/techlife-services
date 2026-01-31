'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createStoreOrderAction, getBankDetailsByProductIdAction } from '@/lib/actions/store'
import { useRouter } from 'next/navigation'
import { Loader2, Store, Truck, Upload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const { items, totalAmount, clearCart } = useCart()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [bankDetails, setBankDetails] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState('transfer') // Default to transfer for MVP
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const supabase = createClient() // Client-side client

    // Fetch Bank Details
    useEffect(() => {
        if (items.length > 0) {
            getBankDetailsByProductIdAction(items[0].id).then(details => {
                setBankDetails(details)
            })
        }
    }, [items])

    if (items.length === 0) {
        router.push('/store/cart')
        return null
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const customerData = {
            fullname: formData.get('fullname') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            address: formData.get('address') as string,
            city: formData.get('city') as string,
            state: formData.get('state') as string,
            zip: formData.get('zip') as string,
            cedula: formData.get('cedula') as string,
        }

        let paymentProofUrl = undefined

        // Handle File Upload if Transfer
        if (paymentMethod === 'transfer') {
            const file = (formData.get('proof') as File)
            if (file && file.size > 0) {
                const fileExt = file.name.split('.').pop()
                const fileName = `proof_${Date.now()}.${fileExt}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('payment-proofs')
                    .upload(fileName, file)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    setError('Error al subir el comprobante. Intenta de nuevo.')
                    setLoading(false)
                    return
                }

                // Get Public URL (assuming bucket is public or we use signed url but let's assume public read for staff)
                // Actually bucket has RLS so we can't use getPublicUrl if not public.
                // But the action stores the path or url? 
                // Let's store the path (key) or full URL.
                // Just use path for simplicity in admin view.
                paymentProofUrl = uploadData.path
            }
        }

        const checkoutData = {
            items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
            customer: customerData,
            paymentMethod: paymentMethod,
            paymentProofUrl: paymentProofUrl
        }

        const res = await createStoreOrderAction(checkoutData)

        if (res?.error) {
            setError(res.error)
            setLoading(false)
            return
        }

        if (res?.success) {
            clearCart()
            router.push(`/store/checkout/success?orderId=${res.orderId}`)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Finalizar Compra</h1>

            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7">
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de Envío</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="fullname">Nombre Completo</Label>
                                        <Input id="fullname" name="fullname" required placeholder="Juan Pérez" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="cedula">Cédula / RUC</Label>
                                        <Input id="cedula" name="cedula" required placeholder="1712345678" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required placeholder="juan@ejemplo.com" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="phone">Teléfono</Label>
                                        <Input id="phone" name="phone" required placeholder="+52 555 555 5555" />
                                    </div>
                                    <div className="col-span-2">
                                        <Label htmlFor="address">Dirección de Entrega</Label>
                                        <Input id="address" name="address" required placeholder="Calle Principal 123" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="city">Ciudad</Label>
                                        <Input id="city" name="city" required placeholder="Quito" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 col-span-2 sm:col-span-1">
                                        <div>
                                            <Label htmlFor="state">Provincia</Label>
                                            <Input id="state" name="state" required placeholder="Pichincha" />
                                        </div>
                                        <div>
                                            <Label htmlFor="zip">C.P.</Label>
                                            <Input id="zip" name="zip" required placeholder="170104" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Método de Pago</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="transfer" onValueChange={setPaymentMethod} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="transfer">Transferencia Bancaria</TabsTrigger>
                                        <TabsTrigger value="card" disabled>Tarjeta (Próximamente)</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="transfer" className="space-y-4 pt-4">
                                        <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm">
                                            <h4 className="font-semibold text-slate-900 mb-2">Datos para Transferencia:</h4>
                                            {bankDetails ? (
                                                <div className="space-y-1 text-slate-700">
                                                    <p><span className="font-medium">Banco:</span> {bankDetails.bank_name}</p>
                                                    <p><span className="font-medium">Tipo:</span> {bankDetails.account_type}</p>
                                                    <p><span className="font-medium">Número:</span> {bankDetails.account_number}</p>
                                                    <p><span className="font-medium">Titular:</span> {bankDetails.account_holder}</p>
                                                    <p><span className="font-medium">C.I./RUC:</span> {bankDetails.holder_id}</p>
                                                </div>
                                            ) : (
                                                <p className="text-yellow-600">No hay cuentas configuradas. Contacte con la tienda.</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="proof">Subir Comprobante (Opcional)</Label>
                                            <div className="flex items-center justify-center w-full">
                                                <label htmlFor="proof" className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 relative">
                                                    {selectedFile ? (
                                                        <div className="flex flex-col items-center justify-center text-green-600">
                                                            <Upload className="w-8 h-8 mb-2" />
                                                            <p className="text-sm font-semibold">{selectedFile.name}</p>
                                                            <p className="text-xs text-slate-500 mt-1">Click para cambiar</p>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                                            <p className="text-sm text-slate-500"><span className="font-semibold">Click para subir</span> imagen</p>
                                                        </div>
                                                    )}
                                                    <Input
                                                        id="proof"
                                                        name="proof"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0] || null
                                                            setSelectedFile(file)
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <p className="text-xs text-slate-500">Puedes enviar el comprobante después si lo prefieres.</p>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="card">
                                        <p className="text-sm text-slate-500">El pago con tarjeta estará disponible pronto.</p>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="text-red-500 text-sm bg-red-50 p-3 rounded border border-red-200">
                                {error}
                            </div>
                        )}

                        {/* Hidden button for form submission logic if needed, but we use external button */}
                    </form>
                </div>

                <div className="lg:col-span-5">
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 sticky top-24">
                        <h3 className="font-bold text-lg text-slate-900 mb-6">Resumen del Pedido</h3>

                        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="h-12 w-12 bg-white rounded border flex-shrink-0 relative overflow-hidden">
                                        {item.image_url && <img src={item.image_url} className="object-cover w-full h-full" alt="" />}
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        <p className="text-slate-500">Cant: {item.quantity}</p>
                                    </div>
                                    <div className="text-sm font-semibold">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-slate-200 pt-4 space-y-2">
                            <div className="flex justify-between text-lg font-bold text-slate-900">
                                <span>Total a Pagar</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg mt-6"
                            type="submit"
                            form="checkout-form"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 'Confirmar Pedido'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
