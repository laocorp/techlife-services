'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search, ShoppingCart, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSalesCart, Product } from '@/context/SalesCartContext'
import { toast } from '@/components/ui/use-toast'

interface SalesCatalogViewProps {
    products: Product[]
}

export default function SalesCatalogView({ products }: SalesCatalogViewProps) {
    const [search, setSearch] = useState('')
    const { addToCart, cart } = useSalesCart()

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    )

    const isInCart = (productId: string) => cart.some(item => item.product.id === productId)
    const getCartQty = (productId: string) => cart.find(item => item.product.id === productId)?.quantity || 0

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="sticky top-20 z-10 bg-background/95 backdrop-blur py-2">
                <div className="relative max-w-md mx-auto md:mx-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                    <Card key={product.id} className="overflow-hidden flex flex-col h-full hover:border-primary/50 transition-colors group">
                        <div className="aspect-square relative bg-muted/20">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    <ShoppingCart className="h-10 w-10 opacity-20" />
                                </div>
                            )}
                            {getCartQty(product.id) > 0 && (
                                <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
                                    {getCartQty(product.id)} en carrito
                                </div>
                            )}
                        </div>

                        <CardContent className="p-3 flex-1 flex flex-col gap-1">
                            <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5em]" title={product.name}>
                                {product.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">{product.sku}</p>

                            <div className="mt-auto pt-2 flex items-baseline justify-between">
                                <span className="font-bold text-lg">${product.sale_price.toFixed(2)}</span>
                                {product.quantity > 0 ? (
                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                        {product.quantity} disp
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                                        Agotado
                                    </Badge>
                                )}
                            </div>
                        </CardContent>

                        <CardFooter className="p-3 pt-0">
                            <Button
                                className="w-full h-8 text-xs"
                                size="sm"
                                disabled={product.quantity <= 0}
                                onClick={() => addToCart(product)}
                            >
                                <ShoppingCart className="w-3 h-3 mr-2" />
                                Agregar
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                    <p>No se encontraron productos que coincidan con "{search}"</p>
                </div>
            )}
        </div>
    )
}
