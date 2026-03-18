'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { UserProfile, Role } from '@/types'

export async function getStaffAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Fetch details of current user to get tenant_id
    const { data: currentProfile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!currentProfile?.tenant_id) return []

    // Fetch all profiles in this tenant
    const { data: staff, error } = await supabase
        .from('profiles')
        .select(`
            *,
            branch:branches(*)
        `)
        .eq('tenant_id', currentProfile.tenant_id)
        .order('full_name', { ascending: true })

    if (error) {
        console.error('Error fetching staff:', error)
        return []
    }

    // Fetch emails from Auth (Admin) to ensure we have them
    const adminClient = createAdminClient()
    const staffWithEmails = await Promise.all(staff.map(async (member) => {
        // We can't batch fetch blindly easily without a list of IDs, 
        // but getting user by ID is fast.
        const { data: { user: authUser }, error: authError } = await adminClient.auth.admin.getUserById(member.id)

        return {
            ...member,
            email: authUser?.email || member.email || 'Sin email'
        }
    }))

    return staffWithEmails
}

export async function updateStaffRoleAction(userId: string, newRole: Role, branchId?: string) {
    console.log('🔧 SERVER: updateStaffRoleAction called:', {
        userId,
        newRole,
        branchId,
        branchIdType: typeof branchId,
        branchIdIsNull: branchId === null,
        branchIdIsUndefined: branchId === undefined,
        branchIdIsEmpty: branchId === ''
    })

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Security Check: Only Owner or Manager should do this
    // We rely on RLS partially, but good to enforce logic here
    const { data: { user } } = await supabase.auth.getUser()
    const { data: requester } = await supabase.from('profiles').select('role, tenant_id').eq('id', user?.id).single()

    if (requester?.role !== 'owner' && requester?.role !== 'manager') {
        return { error: 'No tienes permisos para gestionar personal' }
    }

    // Prepare update data
    const updateData: any = { role: newRole }

    // Only update branch_id if explicitly provided (not undefined)
    if (branchId !== undefined) {
        updateData.branch_id = branchId || null
    }

    console.log('📝 SERVER: Final update data:', updateData)

    // Attempt Update
    const { data: updateResult, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .eq('tenant_id', requester.tenant_id) // Ensure same tenant
        .select()

    console.log('✅ SERVER: Database update result:', { updateResult, error })

    if (error) return { error: error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function createStaffAction(data: {
    email: string,
    password?: string,
    role: Role,
    branchId?: string,
    fullName?: string,
    salesCode?: string
}) {
    const adminClient = createAdminClient()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get Requester Tenant ID
    const { data: { user } } = await supabase.auth.getUser()
    const { data: requester } = await supabase.from('profiles').select('tenant_id, role').eq('id', user?.id).single()

    if (!requester?.tenant_id) return { error: 'No tenant info' }
    if (requester.role !== 'owner' && requester.role !== 'manager') return { error: 'Sin permisos' }

    if (!requester?.tenant_id) return { error: 'No tenant info' }
    if (requester.role !== 'owner' && requester.role !== 'manager') return { error: 'Sin permisos' }

    // 1. Create User via Admin API (Directly, effectively "activating" them)
    // We confirm the email immediately so they can login.
    const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: data.password || 'Temp1234!', // Fallback if not provided, though UI should require it
        email_confirm: true,
        user_metadata: {
            full_name: data.fullName || data.email.split('@')[0],
            tenant_id: requester.tenant_id,
            role: data.role
        }
    })

    if (createError) {
        console.error('Error createUser:', createError)
        // If user exists, we might want to try linking them to the tenant if they are orphaned?
        // But for security, usually we just say "Email already in use".
        // The error message from Supabase is "A user with this email address has already been registered"
        if (createError.message.includes('already been registered')) {
            return { error: 'Este correo ya está registrado. Intenta con otro.' }
        }
        return { error: `Error creando usuario: ${createError.message}` }
    }

    if (authUser.user) {
        // 2. Auto-assign to main branch if no branch specified
        let finalBranchId = data.branchId
        if (!finalBranchId) {
            const { data: mainBranch } = await adminClient
                .from('branches')
                .select('id')
                .eq('tenant_id', requester.tenant_id)
                .eq('is_main', true)
                .single()

            finalBranchId = mainBranch?.id || null
        }

        // 3. Create/Update Profile with Specifics (Branch, Sales Code)
        const { error: profileError } = await adminClient
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                tenant_id: requester.tenant_id,
                // email: data.email, // REMOVED: Column does not exist in profiles table
                full_name: data.fullName || data.email.split('@')[0],
                role: data.role,
                branch_id: finalBranchId,
                sales_code: data.salesCode || null,
                status: 'active'
            })

        if (profileError) {
            console.error('Error setting profile:', profileError)
            return { error: 'Usuario creado pero falló perfil. ' + profileError.message }
        }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteStaffAction(userId: string) {
    const adminClient = createAdminClient()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: requester } = await supabase.from('profiles').select('role, tenant_id').eq('id', user?.id).single()

    if (!requester?.tenant_id || (requester.role !== 'owner' && requester.role !== 'manager')) {
        return { error: 'No tienes permisos para eliminar personal.' }
    }

    if (userId === user?.id) {
        return { error: 'No puedes eliminar tu propia cuenta.' }
    }

    // 1. Check for dependencies (Sales or Assigned Orders)
    const { count: salesCount } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact', head: true })
        .eq('sales_rep_id', userId)

    const { count: assignedCount } = await supabase
        .from('service_orders')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)

    const hasHistory = (salesCount || 0) > 0 || (assignedCount || 0) > 0

    if (hasHistory) {
        // Option: Deactivate instead of Delete to preserve history
        const { error } = await adminClient
            .from('profiles')
            .update({
                status: 'inactive',
                role: 'technician', // Downgrade to prevent login access to sensitive areas if role based
                // We keep the email but they can't login if we disable them in Auth? 
                // Supabase Auth doesn't have "disabled" easily exposed without ban.
                // We'll rely on our app login check which should check status='active'.
            })
            .eq('id', userId)

        // Also Ban in Auth to prevent login
        await adminClient.auth.admin.updateUserById(userId, { ban_duration: '876600h' }) // 100 years

        if (error) {
            console.error('Error deactivating user:', error)
            return { error: 'Error al desactivar usuario.' }
        }

        return { success: true, message: 'Usuario desactivado (no se eliminó por tener historial).' }
    }

    // 2. If no history, HARD DELETE
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
        console.error('Error deleting user:', deleteError)
        return { error: 'Error al eliminar usuario.' }
    }

    revalidatePath('/settings')
    return { success: true, message: 'Usuario eliminado correctamente.' }
}
