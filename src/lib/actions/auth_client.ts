'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

const clientRegisterSchema = z.object({
    fullName: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
})

export type ClientRegisterFormData = z.infer<typeof clientRegisterSchema>

export async function signUpClientAction(data: ClientRegisterFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const adminSupabase = createAdminClient()

    // 1. Validate
    const validated = clientRegisterSchema.safeParse(data)
    if (!validated.success) return { error: "Datos inválidos" }

    const { email, password, fullName } = validated.data

    // 2. Auth SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName }
        }
    })

    if (authError) return { error: authError.message }
    if (!authData.user) return { error: "Error creando usuario" }

    // 3. Create Global 'Client' Profile
    // We use adminSupabase to bypass any RLS that might require being in a tenant
    const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
            id: authData.user.id,
            full_name: fullName,
            role: 'client', // This assumes the ENUM was updated
            status: 'active',
            tenant_id: null // Global user, no specific tenant yet
        })

    if (profileError) {
        console.error("Client Profile Error:", profileError)
        // Cleanup: Delete the auth user to prevent zombie state
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        return { error: "Error configurando perfil de cliente. Inténtalo de nuevo." }
    }

    return { success: true }
}
