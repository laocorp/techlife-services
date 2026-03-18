'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2, Plus, Minus, User, CreditCard, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSalesCart } from '@/context/SalesCartContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { createSalesOrderAction } from '@/lib/actions/orders'

interface Customer {
    id: string
    full_name: string
    userId?: string
}

interface SalesCartViewProps {
    customers: Customer[]
    userRole?: string
}

export default function SalesCartView({ customers, userRole }: SalesCartViewProps) {
    const { cart, removeFromCart, updateQty, cartTotal, clearCart } = useSalesCart()
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentRef, setPaymentRef] = useState('')
    const router = useRouter()

    const handleCheckout = async () => {
        if (!selectedCustomerId) {
            toast({ title: 'Cliente Requerido', description: 'Debes seleccionar un cliente para proceder.', variant: 'destructive' })
            return
        }

        setIsSubmitting(true)

        // For field sales, capture payment ref if provided
        const proof = userRole === 'sales_field' && paymentRef ? paymentRef : undefined

        const res = await createSalesOrderAction({
            customerId: selectedCustomerId,
            items: cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.sale_price
            })),
            paymentProof: proof,
            notes: proof ? `Ref Pago Campo: ${proof}` : undefined
        })

        setIsSubmitting(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({
                title: 'Venta Registrada',
                description: 'La orden ha sido enviada a caja para confirmación.',
                duration: 5000,
            })
            clearCart()
            router.push('/sales/orders')
        }
    }

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground gap-4">
                <div className="bg-muted p-6 rounded-full">
                    <ShoppingCart className="w-12 h-12 opacity-50" />
                </div>
                <h2 className="text-xl font-semibold">Tu carrito está vacío</h2>
                <p>Agrega productos desde el catálogo para comenzar una venta.</p>
                <Button onClick={() => router.push('/sales/catalog')}>Ir al Catálogo</Button>
            </div>
        )
    }

    return (
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Left: Cart Items */}
            <div className="lg:col-span-2 space-y-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" /> Resumen de Orden
                </h1>

                <div className="bg-card rounded-lg border shadow-sm divide-y">
                    {cart.map(item => (
                        <div key={item.product.id} className="p-4 flex gap-4 items-center">
                            {/* Image Placeholder */}
                            <div className="w-16 h-16 bg-muted rounded-md flex-shrink-0 flex items-center justify-center">
                                {item.product.image_url ?
                                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover rounded-md" />
                                    : <ShoppingCart className="w-6 h-6 text-muted-foreground/50" />
                                }
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{item.product.name}</h3>
                                <p className="text-sm text-muted-foreground">${item.product.sale_price.toFixed(2)} x {item.quantity}</p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center border rounded-md h-8">
                                    <button
                                        onClick={() => updateQty(item.product.id, -1)}
                                        className="px-2 hover:bg-muted h-full flex items-center justify-center border-r"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQty(item.product.id, 1)}
                                        className="px-2 hover:bg-muted h-full flex items-center justify-center border-l"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="text-right w-20 font-bold">
                                    ${(item.product.sale_price * item.quantity).toFixed(2)}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                    onClick={() => removeFromCart(item.product.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Checkout */}
            <div className="lg:col-span-1">
                <Card className="sticky top-24 shadow-lg border-primary/20">
                    <CardHeader className="bg-primary/5 pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            Confirmar Venta
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Customer Select */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <User className="w-4 h-4" /> Asignar Cliente <span className="text-red-500">*</span>
                            </label>
                            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Buscar cliente..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {customers.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.full_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                ¿No existe? <span className="underline cursor-pointer hover:text-primary">Crear cliente rápido</span> (Coming soon)
                            </p>
                        </div>

                        {/* Payment Proof (Field Only) */}
                        {userRole === 'sales_field' && (
                            <div className="space-y-2 pt-2 border-t">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" /> Referencia de Pago (Opcional)
                                </label>
                                <Input
                                    placeholder="N° Transferencia / Cheque"
                                    value={paymentRef}
                                    onChange={(e) => setPaymentRef(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Si recolectaste el pago en campo.
                                </p>
                            </div>
                        )}

                        <div className="pt-4 border-t space-y-2">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-2">
                                <span>Total</span>
                                <span className="text-primary">${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-6">
                        <Button
                            className="w-full text-lg h-12 shadow-md hover:shadow-lg transition-all"
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Procesando...' : 'Confirmar Venta'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
