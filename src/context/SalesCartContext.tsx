'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from '@/components/ui/use-toast'

export interface Product {
    id: string
    name: string
    sale_price: number
    quantity: number // Stock
    sku?: string
    image_url?: string
}

export interface CartItem {
    product: Product
    quantity: number
}

interface SalesCartContextType {
    cart: CartItem[]
    addToCart: (product: Product) => void
    removeFromCart: (productId: string) => void
    updateQty: (productId: string, delta: number) => void
    clearCart: () => void
    cartTotal: number
    cartCount: number
}

const SalesCartContext = createContext<SalesCartContextType | undefined>(undefined)

export function SalesCartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([])

    // Persist to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sales_portal_cart')
        if (saved) {
            try {
                setCart(JSON.parse(saved))
            } catch (e) {
                console.error('Failed to parse cart', e)
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('sales_portal_cart', JSON.stringify(cart))
    }, [cart])

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                toast({ title: "Actualizado", description: `Cantidad actualizada: ${existing.quantity + 1}` })
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            toast({ title: "Agregado", description: "Producto agregado al carrito" })
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

    const clearCart = () => setCart([])

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.sale_price * item.quantity), 0)
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <SalesCartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount }}>
            {children}
        </SalesCartContext.Provider>
    )
}

export function useSalesCart() {
    const context = useContext(SalesCartContext)
    if (context === undefined) {
        throw new Error('useSalesCart must be used within a SalesCartProvider')
    }
    return context
}
