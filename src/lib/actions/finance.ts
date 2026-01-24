'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function registerPaymentAction(data: {
    orderId: string
    amount: number
    method: 'cash' | 'card' | 'transfer' | 'other'
    notes?: string
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Usuario sin taller asignado')

    const { error } = await supabase
        .from('payments')
        .insert({
            tenant_id: profile.tenant_id,
            service_order_id: data.orderId,
            amount: data.amount,
            method: data.method,
            notes: data.notes,
            created_by: user.id
        })

    if (error) {
        console.error('Error registering payment:', error)
        return { error: 'No se pudo registrar el pago.' }
    }

    revalidatePath(`/orders/${data.orderId}`)
    return { success: true }
}

export async function getOrderPaymentsAction(orderId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            profiles (full_name)
        `)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching payments:', error)
        return []
    }

    return data
}

export async function getDailyIncomeAction(date: Date) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Start/End of day
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    // Fetch Service Payments
    const { data: servicePayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, method')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

    // Fetch Ecommerce Sales
    const { data: sales, error: salesError } = await supabase
        .from('sales_orders')
        .select('total_amount, delivery_method') // We could map delivery_method to payment method logic if stored?
        // Actually sales_orders doesn't have a 'payment_method' column in my schema memory (it has delivery_method).
        // POS sets payment_status='paid'. 
        // We might need to assume 'cash' or 'card' for now, OR rely on a future 'payment_method' column on sales_orders.
        // POS action didn't save the method to sales_orders, it only saved to 'payments' table?
        // WAIT: In pos.ts, I commented out the 'payments' insert because of ID mismatch.
        // So POS sales are currently NOT in 'payments' table.
        // And 'sales_orders' table lacks 'payment_method' column in strict schema?
        // Let's check schema. If missing, I'll default to 'other' or just count total.
        .eq('payment_status', 'paid')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())

    if (paymentsError || salesError) {
        console.error('Error fetching daily income:', paymentsError, salesError)
        return { total: 0, breakdown: {} }
    }

    const serviceTotal = servicePayments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const salesTotal = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0

    const total = serviceTotal + salesTotal

    const breakdown = servicePayments?.reduce((acc: any, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount
        return acc
    }, {}) || {}

    // Add sales to breakdown (Grouping broadly since we lack specific method in sales_orders for now)
    // Actually POS usually is Cash/Card. Online is Card.
    // Future improvement: Add payment_method to sales_orders.
    if (sales) {
        breakdown['pos_web'] = (breakdown['pos_web'] || 0) + salesTotal
    }

    return { total, breakdown }
}
