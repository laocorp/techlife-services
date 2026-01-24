'use client'

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/context/cart-context'
import { useState } from 'react'

interface AddToCartButtonProps {
    product: {
        id: string
        name: string
        public_price: number | null
        sale_price: number
        image_url?: string
        images?: string[]
    }
    disabled?: boolean
}

export default function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
    const { addItem } = useCart()
    const [added, setAdded] = useState(false)

    const handleAdd = () => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.public_price || product.sale_price,
            quantity: 1,
            image_url: product.images?.[0] || product.image_url
        })

        // Simple visual feedback
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    return (
        <Button
            className={`w-full transition-all ${added ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            disabled={disabled}
            onClick={handleAdd}
        >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {added ? 'Agregado!' : 'Agregar al Carrito'}
        </Button>
    )
}
