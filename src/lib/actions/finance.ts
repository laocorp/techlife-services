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
        .from('ecommerce_orders')
        .select('total_amount, delivery_method')
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

export async function getIncomeHistoryAction(startDate: Date, endDate: Date) {
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

    // Adjust dates for full coverage
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    // 1. Fetch Service Payments
    const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, created_at, method')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true })

    // 2. Fetch Sales Orders (POS/Web)
    const { data: sales, error: salesError } = await supabase
        .from('ecommerce_orders')
        .select('total_amount, created_at')
        .eq('tenant_id', profile.tenant_id)
        .or('payment_status.eq.paid,status.eq.completed,status.eq.delivered') // Ensure we catch paid orders
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: true })

    if (paymentsError || salesError) {
        console.error('Error fetching income history:', paymentsError, salesError)
        return []
    }

    // 3. Aggregate by Date
    const dailyMap = new Map<string, { date: string, services: number, sales: number, total: number }>()

    // Helper to get YYYY-MM-DD
    const getDateKey = (dateStr: string) => new Date(dateStr).toISOString().split('T')[0]

    // Process Payments
    payments?.forEach(p => {
        const key = getDateKey(p.created_at)
        const current = dailyMap.get(key) || { date: key, services: 0, sales: 0, total: 0 }
        current.services += p.amount
        current.total += p.amount
        dailyMap.set(key, current)
    })

    // Process Sales
    sales?.forEach(s => {
        const key = getDateKey(s.created_at)
        const current = dailyMap.get(key) || { date: key, services: 0, sales: 0, total: 0 }
        current.sales += s.total_amount
        current.total += s.total_amount
        dailyMap.set(key, current)
    })

    // 4. Fill missing days? (Optional, but good for charts)
    // For MVP we just return days with data, Recharts handles gaps or we can fill in frontend.

    // Convert to Array and Sort
    const history = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
    return history
}
