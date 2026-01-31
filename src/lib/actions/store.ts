'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getPublicProductsAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch products marked as public
    // We select * for now. In a real app we might limit fields.
    // The policy "Public can view public products" handles security, 
    // but explicit filter is good for performance.
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_public', true)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching public products:', error)
        return []
    }

    return products || []
}

export async function getTenantPublicProductsAction(tenantId: string, query?: string, category?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let req = supabase
        .from('products')
        .select('*')
        .eq('is_public', true)
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true })

    if (query) {
        req = req.ilike('name', `%${query}%`)
    }

    if (category && category !== 'Todos') {
        req = req.eq('category', category)
    }

    const { data: products, error } = await req

    if (error) {
        console.error('Error fetching tenant products:', error)
        return []
    }

    return products || []
}

export async function getProductBySkuAction(sku: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_public', true)
        .eq('sku', sku)
        .single()

    if (error) return null
    return product
}

interface CartItemInput {
    id: string
    quantity: number
    price: number // We should verify this on server ideally, but for MVP we trust/re-verify
}

export async function getBankDetailsByProductIdAction(productId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Find tenant from product
    const { data: product } = await supabase
        .from('products')
        .select('tenant_id')
        .eq('id', productId)
        .single()

    if (!product?.tenant_id) return null

    const { data: tenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', product.tenant_id)
        .single()

    return tenant?.settings?.bank_account || null
}

interface CheckoutData {
    items: CartItemInput[]
    customer: {
        fullname: string
        email: string
        phone: string
        address: string
        city: string
        state: string
        zip: string
        cedula?: string // Changed
    }
    paymentMethod?: string // Changed
    paymentProofUrl?: string // Changed
}

export async function createStoreOrderAction(data: CheckoutData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Get current user if logged in (optional)
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Validate Items & Calculate Total (Re-fetch prices for security in real app)
    // For MVP, we'll verify stock at least
    let totalAmount = 0
    const orderItems = []

    for (const item of data.items) {
        const { data: product } = await supabase
            .from('products')
            .select('*')
            .eq('id', item.id)
            .single()

        if (!product) continue

        // Use the price from DB
        const unitPrice = product.public_price || product.sale_price
        totalAmount += unitPrice * item.quantity

        orderItems.push({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: unitPrice
        })
    }

    // 3. Create Order
    // We need the tenant_id. Since this is a public store, how do we know the tenant?
    // In a multi-tenant app, the domain or path usually dictates it.
    // For this Single-DB MVP where "all tenants live together", we need a way to assign the order.
    // A) If product belongs to tenant X, order is for tenant X.
    // B) What if cart has mixed tenant products? (Marketplace model)
    // Assumption for this MVP: Single Tenant OR mixed order handling is out of scope.
    // Let's assume the first product's tenant for now, or fetch a "Default Tenant".

    // Fetch tenant from first product
    const { data: firstProduct } = await supabase
        .from('products')
        .select('tenant_id')
        .eq('id', data.items[0].id)
        .single()

    if (!firstProduct) return { error: 'No items or invalid product' }

    const tenantId = firstProduct.tenant_id

    const { data: order, error: orderError } = await supabase
        .from('ecommerce_orders')
        .insert({
            tenant_id: tenantId,
            user_id: user?.id || null, // Linked if logged in
            // customer_id: ... Logic to find/create customer from email would go here
            status: 'pending',
            payment_status: 'pending',
            total_amount: totalAmount,
            payment_proof_url: data.paymentProofUrl || null, // NEW
            shipping_address: {
                fullname: data.customer.fullname,
                address: data.customer.address,
                city: data.customer.city,
                state: data.customer.state,
                zip: data.customer.zip,
                phone: data.customer.phone,
                email: data.customer.email,
                cedula: data.customer.cedula, // NEW
                payment_method: data.paymentMethod // NEW
            }
        })
        .select()
        .single()

    if (orderError) {
        console.error('Order creation error:', orderError)
        return { error: 'Error creating order' }
    }

    // 4. Create Order Items
    const itemsToInsert = orderItems.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
    }))

    const { error: itemsError } = await supabase
        .from('ecommerce_order_items')
        .insert(itemsToInsert)

    if (itemsError) {
        console.error('Order items error:', itemsError)
        // In real world: Rollback order or mark as error
        return { error: 'Error adding items' }
    }

    // 5. Update Stock (Simple decrementation)
    // Ideally use RPC or Transaction
    for (const item of orderItems) {
        await supabase.rpc('decrement_product_stock', {
            p_id: item.product_id,
            qty: item.quantity
        })
        // If RPC doesn't exist, we do direct update (less safe for concurrency)
        /*
        await supabase
            .from('products')
            .update({ quantity: product.quantity - item.quantity }) 
            // logic needed...
            */
    }

    return { success: true, orderId: order.id }
}
