'use server'

import { createClient } from '@/lib/supabase/server'
import { assetSchema, AssetFormData } from '@/lib/validations/assets'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createAssetAction(
    customerId: string,
    data: AssetFormData,
    industry: 'automotive' | 'electronics' | 'machinery'
) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Sin tenant' }

    const validated = assetSchema.safeParse(data)
    if (!validated.success) return { error: 'Datos inválidos' }

    const { identifier, brand, model, notes, ...otherDetails } = data

    // Prepare details JSON based on industry extra fields
    let details: any = { brand, model, ...otherDetails }

    const { error } = await supabase.from('customer_assets').insert({
        tenant_id: profile.tenant_id,
        customer_id: customerId,
        identifier: identifier, // Placa, IMEI, etc.
        details: details,
        notes: notes
    })

    if (error) {
        console.error('Create Asset Error:', error)
        return { error: 'Error al crear equipo' }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true }
}

export async function getCustomerAssetsAction(customerId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('customer_assets')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function getCustomerAction(customerId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

    if (error) return null
    return data
}
