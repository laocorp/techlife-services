'use client'

import { useCart } from '@/context/cart-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CartPage() {
    const { items, removeItem, updateQuantity, totalAmount, clearCart } = useCart()

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-20 text-center">
                <div className="bg-card rounded-2xl border border-dashed border-border p-12 max-w-lg mx-auto">
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Tu carrito está vacío</h2>
                    <p className="text-muted-foreground mb-8">Parece que aún no has agregado productos.</p>
                    <Link href="/store">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">Explorar Catálogo</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold text-foreground mb-8">Carrito de Compras</h1>

            <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-6">
                    {items.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center">
                                <div className="h-24 w-24 bg-muted rounded-lg flex-shrink-0 relative overflow-hidden">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <ShoppingBag className="h-8 w-8 text-muted-foreground/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-foreground truncate">{item.name}</h3>
                                    <p className="text-indigo-500 font-semibold mt-1">${item.price.toFixed(2)}</p>
                                </div>

                                <div className="flex items-center gap-4 sm:ml-auto">
                                    <div className="flex items-center border rounded-md">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-none text-slate-500"
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-none text-slate-500"
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-400 hover:text-red-500 hover:bg-red-50"
                                        onClick={() => removeItem(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex justify-between items-center pt-4">
                        <Button variant="ghost" className="text-slate-500" onClick={clearCart}>
                            Vaciar Carrito
                        </Button>
                        <Link href="/store">
                            <Button variant="link" className="text-indigo-600">
                                Continuar Comprando
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-4">
                    <div className="bg-card rounded-xl p-6 border border-border sticky top-24">
                        <h3 className="font-bold text-lg text-foreground mb-6">Resumen del Pedido</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Envío</span>
                                <span className="text-green-500 font-medium">Gratis</span>
                            </div>
                            <div className="h-px bg-border my-2" />
                            <div className="flex justify-between text-lg font-bold text-foreground">
                                <span>Total</span>
                                <span>${totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <Link href="/store/checkout">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg">
                                Proceder al Pago
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>

                        <p className="text-xs text-slate-400 text-center mt-4">
                            Pagos seguros procesados por TechLife
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
