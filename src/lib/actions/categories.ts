'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type CategoryFormData = {
    name: string
    description?: string
}

export async function getCategoriesAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }

    return data
}

export async function createCategoryAction(data: CategoryFormData) {
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

    const { error } = await supabase
        .from('product_categories')
        .insert({
            tenant_id: profile.tenant_id,
            name: data.name,
            description: data.description
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/inventory/categories')
    revalidatePath('/inventory') // Because product form uses it
    return { success: true }
}

export async function updateCategoryAction(id: string, data: CategoryFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from('product_categories')
        .update({
            name: data.name,
            description: data.description
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/inventory/categories')
    revalidatePath('/inventory')
    return { success: true }
}

export async function deleteCategoryAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/inventory/categories')
    revalidatePath('/inventory')
    return { success: true }
}
