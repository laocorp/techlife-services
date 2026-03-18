'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { Branch, Warehouse } from '@/types'

// --- BRANCHES ---

export async function getBranchesAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // RLS will handle tenant filtering
    const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('is_main', { ascending: false }) // Main first
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching branches:', error)
        return []
    }
    return data as Branch[]
}

export async function createBranchAction(data: { name: string, address?: string, phone?: string }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Get Tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const { error } = await supabase
        .from('branches')
        .insert({
            tenant_id: profile.tenant_id,
            name: data.name,
            address: data.address,
            phone: data.phone,
            is_main: false // Default new branches to false
        })

    if (error) return { error: error.message }
    revalidatePath('/settings')
    return { success: true }
}

export async function deleteBranchAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check if main branch (prevent delete)
    const { data: branch } = await supabase.from('branches').select('is_main').eq('id', id).single()
    if (branch?.is_main) return { error: 'No puedes eliminar la sede principal' }

    const { error } = await supabase.from('branches').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}


// --- WAREHOUSES ---

export async function getWarehousesAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('warehouses')
        .select('*, branch:branches(name)')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching warehouses:', error)
        return []
    }
    return data
}

export async function createWarehouseAction(data: { name: string, branch_id?: string }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const { error } = await supabase
        .from('warehouses')
        .insert({
            tenant_id: profile.tenant_id,
            branch_id: data.branch_id || null, // Optional link
            name: data.name
        })

    if (error) return { error: error.message }
    revalidatePath('/settings')
    return { success: true }
}

export async function deleteWarehouseAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Prevent if it has stock? (Foreign key limit usually handles this, but good UX to check)
    // We let DB error handle it for now

    const { error } = await supabase.from('warehouses').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}
