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
        // SECURITY CHECK: Verify if the tenant has an accepted connection with the user
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', (await supabase.auth.getUser()).data.user?.id) // Get current staff ID
            .single()

        // We assume profile.tenant_id exists as this is a protected action for staff
        if (profile?.tenant_id) {
            const { data: connection } = await supabase
                .from('tenant_connections')
                .select('status')
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', targetUserId)
                .eq('status', 'accepted')
                .single()

            // ONLY fetch shared assets if connection is ACCEPTED
            if (connection) {
                let sharedQuery = supabase
                    .from('user_assets')
                    .select('*')
                    .eq('user_id', targetUserId)

                if (industryFilter) {
                    sharedQuery = sharedQuery.eq('type', industryFilter)
                }

                const { data: userAssets, error: sharedError } = await sharedQuery

                if (!sharedError && userAssets) {
                    sharedAssets = userAssets.map(asset => ({
                        id: asset.id,
                        identifier: asset.identifier,
                        details: asset.details,
                        notes: asset.alias ? `Alias: ${asset.alias}` : '',
                        created_at: asset.created_at,
                        is_shared: true,
                        customer_id: customerId
                    }))
                }
            }
        }
    }


    // 3. Merge and Sort
    // DEDUPLICATION: If we have a local asset with the same identifier as a shared one, prefer the local one.
    // Also deduplicate multiple local assets if they somehow got duplicated in DB (show latest).

    let combined = [...localAssets, ...sharedAssets]

    // Use a Map to keep unique identifiers (preferring local, and latest created)
    const uniqueMap = new Map()

    // Sort by created_at DESC first so we keep the latest
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const finalAssets = []
    const seenIdentifiers = new Set()

    for (const asset of combined) {
        // If it has an identifier, ensure uniqueness
        if (asset.identifier) {
            if (!seenIdentifiers.has(asset.identifier)) {
                seenIdentifiers.add(asset.identifier)
                finalAssets.push(asset)
            }
        } else {
            // If no identifier (rare?), just add it
            finalAssets.push(asset)
        }
    }

    return finalAssets
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

export async function ensureLocalAsset(assetId: string, customerId: string, tenantId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Check if it already exists in customer_assets
    const { data: localAsset } = await supabase
        .from('customer_assets')
        .select('id')
        .eq('id', assetId)
        .single()

    if (localAsset) return assetId

    // 2. If not, it must be a shared asset from user_assets
    const { data: sharedAsset } = await supabase
        .from('user_assets')
        .select('*')
        .eq('id', assetId)
        .single()

    if (!sharedAsset) throw new Error('Activo no encontrado (ni local ni compartido)')

    // 2.5 CRITICAL: Check if we ALREADY imported this asset for this customer
    // Match by identifier (Placa/Serial) to prevent duplicates
    const { data: existingImport } = await supabase
        .from('customer_assets')
        .select('id')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .eq('identifier', sharedAsset.identifier)
        .maybeSingle()

    if (existingImport) {
        console.log('Ensure Local Asset: Found existing import, using it:', existingImport.id)
        return existingImport.id
    }

    // 3. Materialize it into customer_assets
    // We create a copy so the workshop can manage it independently (add their own notes, etc.)
    const { data: newAsset, error } = await supabase
        .from('customer_assets')
        .insert({
            tenant_id: tenantId,
            customer_id: customerId,
            identifier: sharedAsset.identifier,
            details: sharedAsset.details,
            notes: `Importado desde Garaje del Cliente. Alias original: ${sharedAsset.alias || 'N/A'}`
        })
        .select('id')
        .single()

    if (error || !newAsset) {
        console.error('Error materializing asset:', error)
        throw new Error('Error al importar activo compartido')
    }

    return newAsset.id
}
