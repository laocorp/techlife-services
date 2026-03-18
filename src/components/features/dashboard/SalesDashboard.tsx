'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2, ShoppingCart, User, Search, Plus, Minus, CreditCard } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSalesOrderAction } from '@/lib/actions/orders'
import { toast } from '@/components/ui/use-toast'
import { UserProfile } from '@/types'

// Types
interface Product {
    id: string
    name: string
    sale_price: number
    quantity: number
    sku?: string
}

interface Customer {
    id: string
    full_name: string
    email?: string
}

interface SalesDashboardProps {
    products: Product[]
    customers: Customer[]
    userRole: string // 'sales_store' | 'sales_field'
}

interface CartItem {
    product: Product
    quantity: number
}

export default function SalesDashboard({ products, customers, userRole }: SalesDashboardProps) {
    const [search, setSearch] = useState('')
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [paymentRef, setPaymentRef] = useState('')

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku?.toLowerCase().includes(search.toLowerCase())
        )
    }, [products, search])

    // Cart Logic
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const updateQty = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta
                return newQty > 0 ? { ...item, quantity: newQty } : item
            }
            return item
        }))
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.sale_price * item.quantity), 0)

    const handleCheckout = async () => {
        if (!selectedCustomerId) {
            toast({ title: 'Cliente Requerido', description: 'Debes seleccionar un cliente para la venta.', variant: 'destructive' })
            return
        }
        if (cart.length === 0) {
            toast({ title: 'Carrito Vacío', description: 'Agrega productos antes de confirmar.', variant: 'destructive' })
            return
        }

        setIsSubmitting(true)

        // Mock Proof for verify
        const proof = userRole === 'sales_field' ? paymentRef : undefined

        const res = await createSalesOrderAction({
            customerId: selectedCustomerId,
            items: cart.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                price: item.product.sale_price
            })),
            paymentProof: proof,
            notes: proof ? `Ref Pago: ${proof}` : undefined
        })

        setIsSubmitting(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Venta Registrada', description: 'Orden enviada a Caja para confirmación.' })
            setCart([])
            setPaymentRef('')
            setSelectedCustomerId('')
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)]">
            {/* LEFT: Catalog */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center gap-4 bg-card p-4 rounded-lg border">
                    <Search className="w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos por nombre o SKU..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 border-none shadow-none focus-visible:ring-0"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-20">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="cursor-pointer hover:border-primary transition-colors group" onClick={() => addToCart(product)}>
                            <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
                                <div>
                                    <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold text-lg">${product.sale_price.toFixed(2)}</span>
                                    {product.quantity > 0 ? (
                                        <Badge variant="secondary" className="text-xs">{product.quantity} disp</Badge>
                                    ) : (
                                        <Badge variant="destructive" className="text-xs">Agotado</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full text-center py-10 text-muted-foreground">
                            No se encontraron productos
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Cart */}
            <div className="w-full lg:w-[400px] bg-card border rounded-lg flex flex-col shadow-xl">
                <div className="p-4 border-b bg-muted/20">
                    <h2 className="font-bold flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5" />
                        Orden de Venta
                    </h2>
                </div>

                {/* Customer Select */}
                <div className="p-4 border-b space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="w-4 h-4" /> Cliente
                    </div>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar Cliente..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {customers.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.product.id} className="flex justify-between items-center bg-background p-3 rounded-md border">
                            <div className="flex-1">
                                <div className="font-medium text-sm line-clamp-1">{item.product.name}</div>
                                <div className="text-xs text-muted-foreground">${item.product.sale_price} u.</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border rounded-md">
                                    <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-muted"><Minus className="w-3 h-3" /></button>
                                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                                    <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-muted"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="text-sm font-bold w-16 text-right">
                                    ${(item.product.sale_price * item.quantity).toFixed(2)}
                                </div>
                                <button onClick={() => removeFromCart(item.product.id)} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && (
                        <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
                            <ShoppingCart className="w-8 h-8 opacity-20" />
                            <p>El carrito está vacío</p>
                        </div>
                    )}
                </div>

                {/* Field Sales Extra: Payment Proof */}
                {userRole === 'sales_field' && (
                    <div className="p-4 border-t bg-muted/10">
                        <label className="text-xs font-semibold flex items-center gap-1 mb-2">
                            <CreditCard className="w-3 h-3" /> Referencia de Pago / Nota
                        </label>
                        <Input
                            placeholder="# Transferencia o Cheque"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                        />
                    </div>
                )}

                {/* Footer Totals */}
                <div className="p-4 border-t bg-muted/20 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button
                        size="lg"
                        className="w-full font-bold"
                        onClick={handleCheckout}
                        disabled={isSubmitting || cart.length === 0}
                    >
                        {isSubmitting ? 'Procesando...' : 'Confirmar Venta'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
