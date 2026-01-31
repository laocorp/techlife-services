'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function getSalesOrderForPrintAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: order, error } = await supabase
        .from('ecommerce_orders')
        .select(`
            id,
            created_at,
            total_amount,
            status,
            tenants (
                name,
                logo_url,
                address,
                city,
                contact_phone,
                contact_email,
                settings
            ),
            ecommerce_order_items (
                quantity,
                unit_price,
                products (
                    name,
                    sku
                )
            ),
            shipping_address
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching sales order:', error)
        return null
    }

    // Transformation
    const safeOrder = {
        ...order,
        tenants: Array.isArray(order.tenants) ? order.tenants[0] : order.tenants,
        customers: order.shipping_address, // Use shipping address as customer info
        sales_order_items: order.ecommerce_order_items?.map((item: any) => ({
            ...item,
            total: item.quantity * item.unit_price, // Calculate on fly
            products: Array.isArray(item.products) ? item.products[0] : item.products
        }))
    }

    return safeOrder
}
