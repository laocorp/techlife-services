import { getPublicProductsAction } from '@/lib/actions/store'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import AddToCartButton from '@/components/features/store/AddToCartButton'

// Force dynamic because of public data updates availability
export const dynamic = 'force-dynamic'

export default async function StorePage() {
    const products = await getPublicProductsAction()

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Nuestros Productos</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Repuestos originales, accesorios y servicios de la mejor calidad.
                </p>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                    <p className="text-muted-foreground text-lg">No hay productos disponibles en este momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border bg-card">
                            <div className="aspect-square bg-muted relative overflow-hidden flex items-center justify-center">
                                {(product.images && product.images.length > 0) || product.image_url ? (
                                    <img
                                        src={product.images?.[0] || product.image_url}
                                        alt={product.name}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                                )}
                                {product.quantity <= 0 && (
                                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                                        <Badge variant="destructive" className="text-sm px-3 py-1">Agotado</Badge>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-4">
                                <div className="text-sm text-muted-foreground mb-1 capitalize">{product.category || 'General'}</div>
                                <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 min-h-[3.5rem]">
                                    {product.name}
                                </h3>
                                <div className="flex items-end justify-between">
                                    <span className="text-xl font-bold text-primary">
                                        ${product.public_price || product.sale_price}
                                    </span>
                                </div>
                            </CardContent>

                            <CardFooter className="p-4 pt-0">
                                <AddToCartButton product={product} disabled={product.quantity <= 0} />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
