'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    image_url?: string
}

interface CartContextType {
    items: CartItem[]
    addItem: (item: CartItem) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    clearCart: () => void
    totalItems: number
    totalAmount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isInitialized, setIsInitialized] = useState(false)

    // Load from local storage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('techlife-cart')
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error('Failed to parse cart', e)
            }
        }
        setIsInitialized(true)
    }, [])

    // Save to local storage on change
    useEffect(() => {
        if (!isInitialized) return
        localStorage.setItem('techlife-cart', JSON.stringify(items))
    }, [items, isInitialized])

    const addItem = (newItem: CartItem) => {
        setItems(currentItems => {
            const existingItem = currentItems.find(item => item.id === newItem.id)
            if (existingItem) {
                return currentItems.map(item =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...currentItems, { ...newItem, quantity: 1 }]
        })
    }

    const removeItem = (id: string) => {
        setItems(currentItems => currentItems.filter(item => item.id !== id))
    }

    const updateQuantity = (id: string, quantity: number) => {
        if (quantity < 1) return
        setItems(currentItems =>
            currentItems.map(item =>
                item.id === id ? { ...item, quantity } : item
            )
        )
    }

    const clearCart = () => {
        setItems([])
    }

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)
    const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalAmount }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
