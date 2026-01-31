'use client'

import { useState, useEffect } from 'react'
import { getProductsAction } from '@/lib/actions/inventory' // We can reuse this or create specific optimized one
import { createPosOrderAction, PosCartItem } from '@/lib/actions/pos'
import ProductGrid from '@/components/features/pos/ProductGrid'
import PosCart from '@/components/features/pos/PosCart'
import { useToast } from '@/components/ui/use-toast'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, History, Plus, Search, Barcode, Printer, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Barcode reader needs to be client-side only and handled carefully
const BarcodeReader = dynamic(() => import('react-barcode-reader'), { ssr: false })

export default function PosPage() {
    const [products, setProducts] = useState<any[]>([])
    const [cart, setCart] = useState<PosCartItem[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [successOpen, setSuccessOpen] = useState(false)
    const [lastOrderId, setLastOrderId] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        loadProducts()
    }, [])

    async function loadProducts() {
        try {
            // Using existing action getting all products, maybe filter only 'product' type?
            // For now, let's get everything.
            // Note: Since this is a client component calling a server action, it's fine.
            const data = await getProductsAction()
            if (data) {
                // Filter out services? Or keep them? Services can be sold in POS too.
                setProducts(data)
            }
        } catch (e) {
            console.error(e)
            toast({ title: 'Error cargando productos', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p)
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                price: product.sale_price,
                quantity: 1,
                image_url: product.images?.[0] || product.image_url
            }]
        })
    }

    const handleScan = (data: string) => {
        // data is the scanned barcode (hopefully matches SKU)
        const product = products.find(p => p.sku === data)
        if (product) {
            addToCart(product)
            toast({ title: `Agregado: ${product.name}` })
        } else {
            toast({ title: 'Producto no encontrado', description: `SKU: ${data}`, variant: 'destructive' })
        }
    }

    const handleError = (err: any) => {
        console.error('Scanner Error', err)
    }

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const removeItem = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const handleCheckout = async (method: 'cash' | 'card' | 'qr', details?: any) => {
        setProcessing(true)
        try {
            const result = await createPosOrderAction({
                items: cart,
                paymentMethod: method,
                amountPaid: details?.amountPaid,
                reference: details?.reference,
                change: details?.change
            })

            if (result.error) {
                throw new Error(result.error)
            }

            // Success Handling
            setLastOrderId((result as any).orderId)
            setSuccessOpen(true)

            // Clear cart
            setCart([])

            // Reload products to update stock displayed
            loadProducts()

        } catch (e: any) {
            toast({ title: 'Error al procesar venta', description: e.message, variant: 'destructive' })
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen bg-slate-100 italic text-slate-500 animate-pulse">Cargando sistema POS...</div>
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
            {/* Logic for Barcode Reader */}
            {/* @ts-ignore */}
            <BarcodeReader onError={handleError} onScan={handleScan} />

            {/* Main Area: Product Grid */}
            <div className="flex-1 p-4 h-full bg-slate-100">
                <ProductGrid products={products} onAdd={addToCart} />
            </div>

            {/* Sidebar: Cart */}
            <div className="w-[400px] h-full flex flex-col">
                <div className="bg-white border-b border-l p-2 flex justify-end">
                    <Link href="/pos/history">
                        <Button variant="ghost" size="sm" className="text-slate-500">
                            <History className="h-4 w-4 mr-2" />
                            Historial
                        </Button>
                    </Link>
                </div>
                <div className="flex-1 overflow-hidden">
                    <PosCart
                        items={cart}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeItem}
                        onCheckout={handleCheckout}
                        loading={processing}
                    />
                </div>
            </div>
            {/* Success Dialog */}
            <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">¡Venta Exitosa!</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-slate-600">
                            La venta ha sido registrada correctamente.
                        </p>
                        <p className="font-mono font-bold mt-2">#{lastOrderId?.slice(0, 8)}</p>
                    </div>
                    <DialogFooter className="flex-col gap-3 sm:flex-col">
                        <a
                            href={`/print/sales/${lastOrderId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full"
                        >
                            <Button className="w-full h-12 text-lg gap-2" variant="outline">
                                <Printer className="h-5 w-5" />
                                Imprimir Recibo
                            </Button>
                        </a>
                        <Button
                            className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => setSuccessOpen(false)}
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Nueva Venta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
