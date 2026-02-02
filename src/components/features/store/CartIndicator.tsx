'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/cart-context'
import { Badge } from '@/components/ui/badge'

export default function CartIndicator() {
    const { totalItems } = useCart()

    return (
        <Link href="/store/cart" className="relative group">
            <div className="p-2 rounded-full hover:bg-indigo-50 transition-colors text-slate-600 group-hover:text-indigo-600">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white border-0">
                        {totalItems}
                    </Badge>
                )}
            </div>
        </Link>
    )
}
