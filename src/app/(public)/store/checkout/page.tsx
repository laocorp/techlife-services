'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createStoreOrderAction, getBankDetailsByProductIdAction } from '@/lib/actions/store'
import { useRouter } from 'next/navigation'
import { Loader2, Store, Truck, Upload, Wallet, MapPin, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function CheckoutPage() {
    const { items, totalAmount, clearCart } = useCart()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [bankDetails, setBankDetails] = useState<any>(null)
    const [paymentMethod, setPaymentMethod] = useState('transfer')
    const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const supabase = createClient()

    // Fetch Bank Details
    useEffect(() => {
        if (items.length > 0) {
            getBankDetailsByProductIdAction(items[0].id).then(details => {
                setBankDetails(details)
            })
        }
    }, [items])

    // Update payment method when delivery method changes
    useEffect(() => {
        if (deliveryMethod === 'pickup') {
            // Enable cash, maybe default to it?
            // setPaymentMethod('cash') 
        } else {
            // If shipping, make sure cash isn't selected (if we want to restrict it)
            if (paymentMethod === 'cash') {
                setPaymentMethod('transfer')
            }
        }
    }, [deliveryMethod])

    if (items.length === 0) {
        router.push('/store/cart')
        return null
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const isPickup = deliveryMethod === 'pickup'

        const customerData = {
            fullname: formData.get('fullname') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            cedula: formData.get('cedula') as string,
            // Use placeholders for pickup to satisfy backend if needed, or real values if provided
            address: isPickup ? 'Retiro en Tienda' : formData.get('address') as string,
            city: isPickup ? 'Retiro en Tienda' : formData.get('city') as string,
            state: isPickup ? 'Retiro en Tienda' : formData.get('state') as string,
            zip: isPickup ? '000000' : formData.get('zip') as string,
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

                paymentProofUrl = uploadData.path
            }
        }

        const checkoutData = {
            items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
            customer: customerData,
            paymentMethod: paymentMethod, // 'transfer' | 'cash'
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
            <h1 className="text-3xl font-bold text-foreground mb-8">Finalizar Compra</h1>

            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7">
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* Delivery Method Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Método de Entrega</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                                        <TabsTrigger value="shipping" className="flex flex-col gap-2 py-4 h-auto data-[state=active]:bg-primary/5 dark:data-[state=active]:bg-primary/10 border border-transparent data-[state=active]:border-primary/20">
                                            <Truck className="h-6 w-6" />
                                            <div className="text-left">
                                                <p className="font-semibold">Envío a Domicilio</p>
                                                <p className="text-xs font-normal opacity-80">Recibe tu pedido en casa</p>
                                            </div>
                                        </TabsTrigger>
                                        <TabsTrigger value="pickup" className="flex flex-col gap-2 py-4 h-auto data-[state=active]:bg-primary/5 dark:data-[state=active]:bg-primary/10 border border-transparent data-[state=active]:border-primary/20">
                                            <Store className="h-6 w-6" />
                                            <div className="text-left">
                                                <p className="font-semibold">Retirar en Tienda</p>
                                                <p className="text-xs font-normal opacity-80">Pasa por nuestro local</p>
                                            </div>
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Customer Information (Conditional) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{deliveryMethod === 'shipping' ? 'Información de Envío' : 'Datos de Contacto'}</CardTitle>
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

                                    {/* Shipping Fields - ONLY show if shipping */}
                                    {deliveryMethod === 'shipping' && (
                                        <>
                                            <div className="col-span-2 border-t pt-4 mt-2">
                                                <p className="text-sm font-medium text-slate-500 mb-4">Dirección de Entrega</p>
                                            </div>
                                            <div className="col-span-2">
                                                <Label htmlFor="address">Dirección</Label>
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
                                        </>
                                    )}

                                    {/* Pickup Info Message */}
                                    {deliveryMethod === 'pickup' && (
                                        <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 flex gap-3 mt-2">
                                            <Store className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                                <p className="font-semibold">Retiro en Tienda</p>
                                                <p>Te notificaremos cuando tu pedido esté listo para retirar.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Método de Pago</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-4">

                                    {/* Transferencia Option */}
                                    <div>
                                        <RadioGroupItem value="transfer" id="payment-transfer" className="peer sr-only" />
                                        <Label
                                            htmlFor="payment-transfer"
                                            className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer relative"
                                        >
                                            <Upload className="h-5 w-5 mt-0.5" />
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between items-center">
                                                    <p className="font-semibold leading-none">Transferencia Bancaria</p>
                                                    {paymentMethod === 'transfer' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                                </div>
                                                <p className="text-sm text-muted-foreground">Envía el comprobante ahora o después.</p>

                                                {/* Transfer Details (Show only if selected) */}
                                                {paymentMethod === 'transfer' && (
                                                    <div className="mt-4 pt-4 border-t text-sm section-transfer-details animate-in fade-in slide-in-from-top-2">
                                                        <div className="bg-muted/50 p-4 rounded border border-border">
                                                            <h4 className="font-semibold text-foreground mb-2">Datos para Transferencia:</h4>
                                                            {bankDetails ? (
                                                                <div className="space-y-1 text-muted-foreground">
                                                                    <p><span className="font-medium text-foreground">Banco:</span> {bankDetails.bank_name}</p>
                                                                    <p><span className="font-medium text-foreground">Tipo:</span> {bankDetails.account_type}</p>
                                                                    <p><span className="font-medium text-foreground">Número:</span> {bankDetails.account_number}</p>
                                                                    <p><span className="font-medium text-foreground">Titular:</span> {bankDetails.account_holder}</p>
                                                                    <p><span className="font-medium text-foreground">C.I./RUC:</span> {bankDetails.holder_id}</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-yellow-600 dark:text-yellow-400">No hay cuentas configuradas.</p>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 space-y-2">
                                                            <Label htmlFor="proof">Subir Comprobante (Opcional)</Label>
                                                            <Input
                                                                id="proof"
                                                                name="proof"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                                            />
                                                            <p className="text-xs text-muted-foreground">Si no lo tienes ahora, puedes subirlo desde "Mis Compras" más tarde.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Label>
                                    </div>

                                    {/* Cash on Pickup Option */}
                                    <div className={deliveryMethod === 'shipping' ? 'opacity-50 pointer-events-none' : ''}>
                                        <RadioGroupItem value="cash" id="payment-cash" className="peer sr-only " disabled={deliveryMethod === 'shipping'} />
                                        <Label
                                            htmlFor="payment-cash"
                                            className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer relative"
                                        >
                                            <Wallet className="h-5 w-5 mt-0.5" />
                                            <div className="space-y-1 flex-1">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold leading-none">Pagar en Tienda (Efectivo)</p>
                                                        {deliveryMethod === 'shipping' && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">Solo Retiro</span>}
                                                    </div>
                                                    {paymentMethod === 'cash' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                                </div>
                                                <p className="text-sm text-muted-foreground">Paga al momento de retirar tu pedido.</p>
                                            </div>
                                        </Label>
                                    </div>

                                    {/* Card Payment (Disabled) */}
                                    <div className="opacity-50 pointer-events-none">
                                        <RadioGroupItem value="card" id="payment-card" className="peer sr-only" disabled />
                                        <Label
                                            htmlFor="payment-card"
                                            className="flex items-start gap-4 rounded-lg border-2 border-muted bg-popover p-4"
                                        >
                                            <div className="h-5 w-5 mt-0.5 flex items-center justify-center">💳</div>
                                            <div className="space-y-1">
                                                <p className="font-semibold leading-none">Tarjeta de Crédito / Débito</p>
                                                <p className="text-sm text-muted-foreground">Próximamente disponible.</p>
                                            </div>
                                        </Label>
                                    </div>

                                </RadioGroup>
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                                {error}
                            </div>
                        )}
                    </form>
                </div>

                <div className="lg:col-span-5">
                    <div className="bg-card rounded-xl p-6 border border-border sticky top-24 shadow-sm">
                        <h3 className="font-bold text-lg text-foreground mb-6">Resumen del Pedido</h3>

                        <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="h-12 w-12 bg-white rounded border border-border flex-shrink-0 relative overflow-hidden">
                                        {item.image_url && <img src={item.image_url} className="object-cover w-full h-full" alt="" />}
                                    </div>
                                    <div className="flex-1 text-sm">
                                        <p className="font-medium text-foreground">{item.name}</p>
                                        <p className="text-muted-foreground">Cant: {item.quantity}</p>
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-border pt-4 space-y-2">
                            {/* Delivery Cost placeholder if we had logic */}
                            {deliveryMethod === 'shipping' && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Envío</span>
                                    <span>Calculado al confirmar</span>
                                    {/* Or "Gratis" if logic says so */}
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-foreground">
                                <span>Total a Pagar</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg mt-6 text-white"
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
