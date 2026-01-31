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
    revalidatePath(`/customers/${customerId}`)
    return { success: true }
}

export async function createQuickAssetAction(
    customerId: string,
    data: { identifier: string; brand: string; model: string; color?: string; type: string }
) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Sin tenant' }

    try {
        // 1. Ensure Customer Exists Locally
        // validation/import logic is handled here
        const { ensureLocalCustomer } = await import('@/lib/actions/customers')
        const realCustomerId = await ensureLocalCustomer(customerId)

        // 2. Create Asset
        const details = {
            make: data.brand,
            model: data.model,
            color: data.color || ''
        }

        // Map type to industry if needed, for now use generic mapping or passed type
        // Assuming the UI provides a valid 'type' enum like 'automotive', 'electronics'
        // But the customer_assets table relies on tenant industry usually? 
        // Actually customer_assets doesn't have a 'type' column, it just has identifier and details.
        // Wait, the shared assets logic checks `type` on `user_assets`, but `customer_assets` are generic?
        // Let's check schema. `customer_assets` usually relies on the Tenant's Industry context.
        // But `user_assets` has a `type` column.

        // For `customer_assets`, we just insert details.

        const { error } = await supabase.from('customer_assets').insert({
            tenant_id: profile.tenant_id,
            customer_id: realCustomerId,
            identifier: data.identifier,
            details: details,
            notes: 'Creado desde Nueva Orden'
        })

        if (error) throw error

        return { success: true, newCustomerId: realCustomerId } // Return new ID in case it changed
    } catch (e: any) {
        console.error('Quick Asset Error:', e)
        return { error: e.message || 'Error al crear equipo' }
    }
}

export async function getCustomerAssetsAction(customerId: string, industryFilter?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Determine User Context
    let targetUserId: string | null = null
    let localAssets: any[] = []

    // CASE A: Virtual Customer (Direct Connection)
    if (customerId.startsWith('virtual-')) {
        targetUserId = customerId.replace('virtual-', '')
        // Virtual customers don't have local assets in the `customer_assets` table
        localAssets = []
    }

    // CASE B: Local Customer (Real Record)
    else {
        // Fetch Local Assets
        let query = supabase
            .from('customer_assets')
            .select('*, tenants!inner(industry)')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })

        if (industryFilter) {
            query = query.eq('tenants.industry', industryFilter)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)
        localAssets = data || []

        // Resolve User ID for shared assets
        const { data: customer } = await supabase
            .from('customers')
            .select('user_id')
            .eq('id', customerId)
            .maybeSingle()

        targetUserId = customer?.user_id || null
    }

    let sharedAssets: any[] = []

    if (targetUserId) {
        // Fetch from user_assets (Garaje)
        // We might want to filter by industry/type if mapped (e.g. automotive -> automotive)
        let sharedQuery = supabase
            .from('user_assets')
            .select('*')
            .eq('user_id', targetUserId)

        if (industryFilter) {
            // Mapping: industry 'automotive' matches type 'automotive'
            // industry 'electronics' matches type 'electronics'
            // logic is 1:1 for now
            sharedQuery = sharedQuery.eq('type', industryFilter)
        }

        const { data: userAssets, error: sharedError } = await sharedQuery

        console.log('DEBUG: User Assets Result:', {
            count: userAssets?.length,
            error: sharedError,
            firstAsset: userAssets?.[0]
        })

        if (!sharedError && userAssets) {
            sharedAssets = userAssets.map(asset => ({
                id: asset.id,
                identifier: asset.identifier,
                details: asset.details,
                notes: asset.alias ? `Alias: ${asset.alias}` : '',
                created_at: asset.created_at,
                is_shared: true, // Marker for potentially different UI handling
                customer_id: customerId // Keep context
            }))
        }
    }

    // 3. Merge and Sort
    const allAssets = [...localAssets, ...sharedAssets].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return allAssets
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
