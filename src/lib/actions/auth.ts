'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { RegisterFormData, registerSchema } from '@/lib/validations/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function signUpAction(data: RegisterFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const adminSupabase = createAdminClient()

    // 1. Validate Input
    const validatedFields = registerSchema.safeParse(data)

    if (!validatedFields.success) {
        return { error: 'Datos inválidos. Verifica el formulario.' }
    }

    const { email, password, fullName, companyName, industry } = validatedFields.data

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Error inesperado al crear usuario.' }
    }

    // 3. Create Tenant
    // Note: Using Service Role or a Postgres Function is safer for integrity, 
    // but for this MVP phase using RLS "insert ok" works if we handle it carefully.
    // Ideally, RLS prevents inserting to tenants unless... wait, our RLS says "Anyone can create a tenant".

    const slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)

    const { data: tenantData, error: tenantError } = await adminSupabase
        .from('tenants')
        .insert({
            name: companyName,
            slug: slug,
            industry: industry,
        })
        .select()
        .single()

    if (tenantError) {
        // Rollback: Delete the auth user if tenant creation fails
        console.error('Tenant creation error:', tenantError)
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        return { error: 'Error al crear el taller. Por favor intenta de nuevo.' }
    }

    // 4. Create Profile linked to Tenant
    // The user IS created in auth.users. Now we need a profile in public.profiles.
    // Our RLS says "Users can update own profile" but for INSERT?
    // We missed an explicit INSERT policy for profiles! 
    // "Users can view profiles in same tenant"
    // We need to allow user to insert their OWN profile.

    const { error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
            id: authData.user.id,
            tenant_id: tenantData.id,
            full_name: fullName,
            role: 'owner',
            status: 'active'
        })

    if (profileError) {
        console.error('Profile creation error:', profileError)
        return { error: 'Error al crear perfil de usuario.' }
    }

    return { success: true }
}
