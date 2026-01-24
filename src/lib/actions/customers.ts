'use server'

import { createClient } from '@/lib/supabase/server'
import { customerSchema, CustomerFormData } from '@/lib/validations/customers'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCustomerAction(data: CustomerFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Get User Tenant (Securely via subquery or getting user profile first)
    // Our RLS relies on "get_current_tenant_id()".
    // However, for insertion, our policy "Users can insert customers in same tenant" 
    // checks `with check (tenant_id = get_current_tenant_id())`.
    // So we MUST provide the correct tenant_id in the insert payload, OR 
    // have a trigger set it. 
    // Let's fetch the tenant_id first to be explicit and avoid "new row violates row-level security policy"
    // if we tried to insert without it (it's not null).

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Usuario sin taller asignado' }

    const validatedFields = customerSchema.safeParse(data)
    if (!validatedFields.success) return { error: 'Datos inválidos' }

    const { fullName, taxId, email, phone, address } = validatedFields.data

    const { error } = await supabase.from('customers').insert({
        tenant_id: profile.tenant_id,
        full_name: fullName,
        tax_id: taxId,
        email,
        phone,
        address
    })

    if (error) {
        console.error('Create Customer Error:', error)
        return { error: 'Error al crear cliente' }
    }

    revalidatePath('/customers')
    return { success: true }
}

export async function getCustomersAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // RLS filters automatically
    const { data, error } = await supabase
        .from('customers')
        .select('*, user_id')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}
