'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getProfileAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return {
        ...profile,
        email: user.email // Append email from Auth
    }
}

export async function updateProfileAction(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const fullName = formData.get('full_name') as string
    const phone = formData.get('phone') as string

    // Use upsert to handle both create and update scenarios
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id, // Required for upsert
            full_name: fullName,
            phone: phone,
            updated_at: new Date().toISOString()
        })
        .select()

    if (error) {
        console.error('Update Profile Error:', error)
        return { error: `Error: ${error.message}` }
    }

    if (!data || data.length === 0) {
        // This typically means RLS blocked the return of the row, even if it might have saved.
        // But usually with .select() it returns the row.
        return { error: 'No se pudo verificar la actualización. Verifique permisos RLS.' }
    }

    revalidatePath('/portal/profile')
    return { success: true }
}
