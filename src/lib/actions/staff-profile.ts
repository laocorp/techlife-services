'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateStaffAvatarAction(avatarUrl: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('profiles')
        .update({
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error('Update Avatar Error:', error)
        return { error: 'Error al actualizar foto de perfil' }
    }

    revalidatePath('/sales/profile')
    return { success: true }
}

export async function updateStaffPhoneAction(phone: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const { error } = await supabase
        .from('profiles')
        .update({
            phone: phone,
            updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

    if (error) {
        console.error('Update Phone Error:', error)
        return { error: 'Error al actualizar teléfono' }
    }

    revalidatePath('/sales/profile')
    return { success: true }
}
