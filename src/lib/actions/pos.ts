'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface PosCartItem {
    id: string
    name: string
    price: number
    quantity: number
    image_url?: string
}

export interface PosOrderData {
    items: PosCartItem[]
    paymentMethod: 'cash' | 'card' | 'qr'
    customerName?: string // Optional for walk-ins
    amountPaid?: number
    change?: number
    reference?: string
}

export async function createPosOrderAction(data: PosOrderData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    let totalAmount = 0
    const orderItems = []

    // 1. Verify items and calculate total
    for (const item of data.items) {
        // We trust the price sent from client for POS speed? 
        // Better to fetch strict price, but for "Quick Sale" usually we might allow overrides.
        // For MVP, let's fetch to be safe.
        const { data: product } = await supabase
            .from('products')
            .select('sale_price, public_price')
            .eq('id', item.id)
            .single()

        if (!product) continue

        // Use sale_price (store price) or public_price. 
        // POS usually uses standard sale_price.
        const unitPrice = product.sale_price || 0
        totalAmount += unitPrice * item.quantity

        orderItems.push({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: unitPrice
        })
    }

    // 2. Create Order in SALES_ORDERS
    const { data: order, error: orderError } = await supabase
        .from('sales_orders')
        .insert({
            tenant_id: profile.tenant_id,
            // POS sales might not have a linked user customer account if walk-in
            // We can leave customer_id null or link if we implement customer search later
            customer_id: null,
            status: 'delivered', // POS sales are immediate
            payment_status: 'paid', // POS sales are immediate
            total_amount: totalAmount,
            delivery_method: 'pickup',
            shipping_address: 'Mostrador', // Simplified for POS
            contact_phone: null
            // channel: 'pos' // If we add channel column later
        })
        .select()
        .single()

    if (orderError) {
        console.error('POS Order Error:', orderError)
        return { error: 'Failed to create order' }
    }

    // 3. Create Items
    const itemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
    }))

    const { error: itemsError } = await supabase
        .from('sales_order_items')
        .insert(itemsToInsert)

    if (itemsError) {
        console.error('POS Items Error:', itemsError)
        return { error: 'Failed to add items' }
    }

    // 4. Update Stock
    for (const item of orderItems) {
        await supabase.rpc('decrement_product_stock', {
            p_id: item.product_id,
            qty: item.quantity
        })
    }

    // 5. Register Payment in Finance (Optional but good practice)
    // We already have 'payments' table from Phase 2 Finance.
    await supabase.from('payments').insert({
        tenant_id: profile.tenant_id,
        // service_order_id: ... wait, this links to service_orders, not ecommerce_orders.
        // We might need to update payments table to support ecommerce_order_id or make it polymorphic.
        // For now, we skip or add a TODO.
        amount: totalAmount,
        method: data.paymentMethod,
        notes: `Venta POS #${order.id.slice(0, 8)}`,
        created_by: user.id
    })

    revalidatePath('/pos')
    revalidatePath('/inventory')

    return { success: true, orderId: order.id }
}
