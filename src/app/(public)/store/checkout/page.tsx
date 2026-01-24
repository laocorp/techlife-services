'use client'

import { useState } from 'react'
import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createStoreOrderAction } from '@/lib/actions/store'
import { useRouter } from 'next/navigation'
import { Loader2, Store, Truck } from 'lucide-react'

export default function CheckoutPage() {
    const { items, totalAmount, clearCart } = useCart()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        }

        const checkoutData = {
            items: items.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
            customer: customerData
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Información de Envío</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Label htmlFor="fullname">Nombre Completo</Label>
                                        <Input id="fullname" name="fullname" required placeholder="Juan Pérez" />
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
                                        <Label htmlFor="address">Dirección</Label>
                                        <Input id="address" name="address" required placeholder="Calle Principal 123" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <Label htmlFor="city">Ciudad</Label>
                                        <Input id="city" name="city" required placeholder="Ciudad de México" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 col-span-2 sm:col-span-1">
                                        <div>
                                            <Label htmlFor="state">Estado</Label>
                                            <Input id="state" name="state" required placeholder="CDMX" />
                                        </div>
                                        <div>
                                            <Label htmlFor="zip">C.P.</Label>
                                            <Input id="zip" name="zip" required placeholder="01000" />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
                                        {error}
                                    </div>
                                )}
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Método de Pago</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm text-slate-600">
                                <p className="font-semibold mb-1">Pago Contra Entrega / Transferencia (Demo)</p>
                                <p>Por el momento, nos pondremos en contacto contigo para coordinar el pago y envío. No se realizará ningún cargo ahora.</p>
                            </div>
                        </CardContent>
                    </Card>
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
