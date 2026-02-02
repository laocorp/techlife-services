'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Search, ShoppingCart, Wrench } from 'lucide-react'
import {
    getOrderItemsAction,
    addOrderItemAction,
    removeOrderItemAction
} from '@/lib/actions/order-items'
import { getProductsAction } from '@/lib/actions/inventory'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from '@/components/ui/badge'

type OrderItemsManagerProps = {
    orderId: string
}

export default function OrderItemsManager({ orderId }: OrderItemsManagerProps) {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Manual add/edit state
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
    const [draftItem, setDraftItem] = useState<{ quantity: number, unitPrice: number }>({ quantity: 1, unitPrice: 0 })

    // Product Search State
    const [searchTerm, setSearchTerm] = useState('')
    const [products, setProducts] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        loadItems()
    }, [orderId])

    useEffect(() => {
        if (isDialogOpen) {
            searchProducts('')
        }
    }, [isDialogOpen])

    async function loadItems() {
        setLoading(true)
        const data = await getOrderItemsAction(orderId)
        setItems(data)
        setLoading(false)
    }

    async function searchProducts(term: string) {
        setSearching(true)
        const data = await getProductsAction(term)
        setProducts(data || [])
        setSearching(false)
    }

    async function handleAddItem(product: any) {
        setAdding(true)
        try {
            await addOrderItemAction({
                orderId,
                productId: product.id,
                quantity: draftItem.quantity,
                unitPrice: draftItem.unitPrice
            })
            setIsDialogOpen(false)
            setSelectedProduct(null)
            loadItems()
        } catch (error) {
            console.error(error)
        } finally {
            setAdding(false)
        }
    }

    const [itemToDelete, setItemToDelete] = useState<string | null>(null)

    async function confirmDelete() {
        if (!itemToDelete) return

        try {
            const res = await removeOrderItemAction(itemToDelete, orderId)
            if (res?.error) {
                alert(`Error: ${res.error}`)
            } else {
                loadItems()
            }
        } catch (error) {
            console.error(error)
            alert('Ocurrió un error al eliminar')
        } finally {
            setItemToDelete(null)
        }
    }

    const totalOrder = items.reduce((sum, item) => sum + (item.total || 0), 0)

    return (
        <div className="space-y-4">
            {/* Delete Confirmation Dialog */}
            <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>¿Eliminar ítem?</DialogTitle>
                        <DialogDescription>
                            Esta acción devolverá el producto al inventario.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setItemToDelete(null)}>Cancelar</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Repuestos y Servicios</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar Ítem
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Agregar Producto o Servicio</DialogTitle>
                            <DialogDescription>
                                Busca en tu inventario para agregar a la orden.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    className="pl-9"
                                    onChange={(e) => searchProducts(e.target.value)}
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
                                {products.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground text-sm">
                                        No se encontraron productos.
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {products.map((prod) => (
                                            <div key={prod.id} className="p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <div className="font-medium text-sm text-foreground">{prod.name}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                            {prod.type === 'product' ? (
                                                                <Badge variant="outline" className="text-[10px] px-1 h-5">Stock: {prod.quantity}</Badge>
                                                            ) : (
                                                                <Badge variant="secondary" className="text-[10px] px-1 h-5">Servicio</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {/* Select Logic: If selected, show inputs, else show select button */}
                                                    {selectedProduct?.id !== prod.id && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => {
                                                                setSelectedProduct(prod)
                                                                setDraftItem({ quantity: 1, unitPrice: prod.sale_price })
                                                            }}
                                                        >
                                                            Seleccionar
                                                        </Button>
                                                    )}
                                                </div>

                                                {selectedProduct?.id === prod.id && (
                                                    <div className="bg-muted p-3 rounded-md grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                                                        <div>
                                                            <Label className="text-xs">Cantidad</Label>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                className="h-8"
                                                                value={draftItem.quantity}
                                                                onChange={(e) => setDraftItem({ ...draftItem, quantity: parseInt(e.target.value) || 1 })}
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs">Precio Unit.</Label>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                className="h-8"
                                                                value={draftItem.unitPrice}
                                                                onChange={(e) => setDraftItem({ ...draftItem, unitPrice: parseFloat(e.target.value) || 0 })}
                                                            />
                                                        </div>
                                                        <div className="col-span-2 flex justify-end gap-2 pt-1">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setSelectedProduct(null)}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                disabled={adding}
                                                                onClick={() => handleAddItem(prod)}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                Confirmar Agregar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            {/* Items Table / List */}
            <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 font-medium text-sm text-muted-foreground">
                    <div className="col-span-12 md:col-span-5">Ítem</div>
                    <div className="col-span-3 md:col-span-2 text-center">Cant.</div>
                    <div className="col-span-3 md:col-span-2 text-right">Precio</div>
                    <div className="col-span-3 md:col-span-2 text-right">Total</div>
                    <div className="col-span-1 md:col-span-1"></div>
                </div>
                <div className="divide-y">
                    {loading ? (
                        <div className="p-4 text-center text-muted-foreground">Cargando ítems...</div>
                    ) : items.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">No hay ítems agregados a esta orden.</div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                                <div className="col-span-12 md:col-span-5">
                                    <div className="font-medium text-foreground">{item.products?.name || 'Ítem desconocido'}</div>
                                    <div className="text-xs text-muted-foreground capitalize">{item.products?.type === 'service' ? 'Servicio' : 'Repuesto'}</div>
                                </div>
                                <div className="col-span-3 md:col-span-2 text-center text-foreground">
                                    {item.quantity}
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right text-muted-foreground">
                                    ${item.unit_price}
                                </div>
                                <div className="col-span-3 md:col-span-2 text-right font-medium text-foreground">
                                    ${item.total}
                                </div>
                                <div className="col-span-1 md:col-span-1 text-right">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => setItemToDelete(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="p-4 flex justify-between items-center bg-muted/20 border-t border-border">
                    <span className="font-semibold text-foreground">Total Estimado:</span>
                    <span className="text-xl font-bold text-foreground">${totalOrder.toFixed(2)}</span>
                </div>
            </div>
        </div>
    )
}
