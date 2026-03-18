'use client'

import { Badge } from '@/components/ui/badge'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Package, AlertTriangle, Building2 } from 'lucide-react'

interface StockDisplayProps {
    stock: number
    minStock: number
    breakdown: { warehouse: string; quantity: number }[]
}

export default function StockDisplay({ stock, minStock, breakdown }: StockDisplayProps) {
    const isLowStock = stock <= minStock
    const hasBreakdown = breakdown && breakdown.length > 0

    if (!hasBreakdown) {
        // Fallback if no breakdown available (services or legacy)
        return (
            <div className="flex flex-col items-center">
                <span className={`font-bold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                    {stock}
                </span>
            </div>
        )
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex flex-col items-center cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group">
                    <span className={`font-bold ${isLowStock ? 'text-destructive' : 'text-foreground'} group-hover:underline underline-offset-4 decoration-dotted`}>
                        {stock}
                    </span>
                    {isLowStock && (
                        <span className="flex items-center text-[10px] text-red-600 mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Bajo Stock
                        </span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-60">
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center">
                        <Building2 className="w-4 h-4 mr-2" />
                        Stock por Bodega
                    </h4>
                    <div className="text-sm divide-y">
                        {breakdown.map((b, i) => (
                            <div key={i} className="flex justify-between py-1">
                                <span className="text-muted-foreground">{b.warehouse}</span>
                                <span className="font-medium">{b.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
