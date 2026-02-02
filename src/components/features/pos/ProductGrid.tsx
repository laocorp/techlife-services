'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Package, ImageIcon } from 'lucide-react'

interface Product {
    id: string
    name: string
    sku?: string
    sale_price: number
    quantity: number
    image_url?: string
    images?: string[]
    category?: string
}

interface ProductGridProps {
    products: Product[]
    onAdd: (product: Product) => void
}

export default function ProductGrid({ products, onAdd }: ProductGridProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

    const categories = Array.from(new Set(products.map(p => p.category || 'General')))

    const filteredProducts = products.filter(product => {
        const matchTerm = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchCategory = categoryFilter ? product.category === categoryFilter : true
        return matchTerm && matchCategory
    })

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header / Search */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nombre o código..."
                        className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <Badge
                        variant={categoryFilter === null ? "default" : "outline"}
                        className="cursor-pointer whitespace-nowrap"
                        onClick={() => setCategoryFilter(null)}
                    >
                        Todos
                    </Badge>
                    {categories.map(cat => (
                        <Badge
                            key={cat}
                            variant={categoryFilter === cat ? "default" : "outline"}
                            className="cursor-pointer whitespace-nowrap"
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 content-start">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.id}
                            onClick={() => onAdd(product)}
                            className="cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group overflow-hidden border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700"
                        >
                            <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-600 relative items-center justify-center flex overflow-hidden">
                                {(product.images?.[0] || product.image_url) ? (
                                    <img
                                        src={product.images?.[0] || product.image_url}
                                        alt={product.name}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <Package className="h-8 w-8 text-slate-300 dark:text-slate-500" />
                                )}
                                <div className="absolute top-1 right-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-slate-700 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600">
                                    ${product.sale_price}
                                </div>
                                {product.quantity <= 0 && (
                                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/70 flex items-center justify-center font-bold text-red-600 dark:text-red-400 text-sm">
                                        AGOTADO
                                    </div>
                                )}
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-700">
                                <h4 className="text-xs font-medium text-slate-700 dark:text-slate-100 line-clamp-2 leading-tight min-h-[2.5em]">
                                    {product.name}
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Stock: {product.quantity}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
