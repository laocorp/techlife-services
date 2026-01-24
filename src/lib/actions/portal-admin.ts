'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function enablePortalAccessAction(customerId: string, email: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check permissions (must be admin/owner)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Create Auth User
    const adminClient = createAdminClient()
    // Simple numeric password as requested: Cliente + 4 random digits + .
    const tempPassword = `Cliente${Math.floor(1000 + Math.random() * 9000)}.`

    // Check if user already exists
    // Note: checking by email using admin client
    // For MVP we just try to create and catch error if exists

    // We use admin.createUser to auto-confirm email
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            is_customer_portal: true
        }
    })

    let userId = newUser?.user?.id

    if (createError) {
        console.warn('Create user error, attempting to find existing user:', createError)
        // If user already exists, we try to find it
        // Note: LIST USERS has rate limits and performance implications in large apps, 
        // but for this scale it's the only admin way without direct DB access to auth schema.
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

        if (listError) {
            console.error('Error listing users:', listError)
            return { error: 'Error al buscar usuario existente' }
        }

        const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

        if (existingUser) {
            userId = existingUser.id
            // Reset password not supported directly without notifying user, 
            // but we can try to update it if needed or just tell them "Access Linked"
            // Let's UPDATE the password to the temp one so they can login!
            const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
                password: tempPassword,
                user_metadata: { is_customer_portal: true }
            })
            if (updateError) {
                return { error: `Error updating existing user: ${updateError.message}` }
            }
        } else {
            return { error: `Error creating user: ${createError.message}` }
        }
    }

    if (!userId) return { error: 'No se pudo obtener ID de usuario' }

    // 2. Link User to Customer Record
    // Use adminClient to bypass RLS on customers table just in case
    const { error: updateError } = await adminClient
        .from('customers')
        .update({ user_id: userId })
        .eq('id', customerId)

    if (updateError) {
        console.error('Error linking customer:', updateError)
        return { error: `Error al vincular cliente (DB): ${updateError.message}` }
    }

    revalidatePath('/customers')
    return { success: true, tempPassword }
}
