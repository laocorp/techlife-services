'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function lookupUserByEmailAction(email: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.rpc('lookup_user_by_email', {
        search_email: email
    })

    if (error) {
        console.error('Error looking up user:', error)
        return { error: 'Error al buscar usuario' }
    }

    if (!data || data.length === 0) {
        return { success: true, user: null }
    }

    // Check if there is already a connection
    const targetUserId = data[0].id
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // We need to know who is asking. Assuming it's a tenant admin.
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', currentUser?.id)
        .single()

    let connectionStatus = null

    if (profile?.tenant_id) {
        const { data: connection } = await supabase
            .from('tenant_connections')
            .select('status, initiated_by')
            .eq('tenant_id', profile.tenant_id)
            .eq('user_id', targetUserId)
            .single()

        if (connection) {
            connectionStatus = connection.status
        }
    }

    return {
        success: true,
        user: { ...data[0], connectionStatus }
    }
}

export async function sendConnectionRequestAction(userId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant ID and Name
    const { data: profile } = await supabase
        .from('profiles')
        .select(`
            tenant_id,
            tenants (
                name
            )
        `)
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const { error } = await supabase
        .from('tenant_connections')
        .insert({
            tenant_id: profile.tenant_id,
            user_id: userId,
            status: 'pending',
            initiated_by: 'tenant'
        })

    if (error) {
        console.error('Error sending connection request:', error)
        return { error: 'Failed to send request' }
    }

    // Send Notification to User
    // profile.tenants might be an array depending on generation, handle safely
    const tenantData = profile.tenants
    const tenantName = Array.isArray(tenantData) ? tenantData[0]?.name : (tenantData as any)?.name || 'Un taller'

    await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Nueva Solicitud de Conexión',
        message: `${tenantName} te ha invitado a conectar en TechLife Portal.`,
        type: 'info',
        link: '/portal/dashboard', // Direct user to dashboard where pending requests are shown
        read: false
    })

    revalidatePath('/customers')
    return { success: true }
}

export async function cancelConnectionRequestAction(userId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const { error } = await supabase
        .from('tenant_connections')
        .delete()
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', userId)

    if (error) {
        console.error('Error cancelling connection request:', error)
        return { error: 'Failed to cancel request' }
    }

    revalidatePath('/customers')
    return { success: true }
}

export async function respondToInvitationAction(connectionId: string, status: 'accepted' | 'rejected') {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Connection Details FIRST (to know tenant_id)
    const { data: connection } = await supabase
        .from('tenant_connections')
        .select('tenant_id')
        .eq('id', connectionId)
        .single()

    if (!connection) return { error: 'Invitation not found' }

    // 2. Verify and Update
    const { error } = await supabase
        .from('tenant_connections')
        .update({ status: status })
        .eq('id', connectionId)
        .eq('user_id', user.id) // Security check in DB

    if (error) {
        console.error('Error responding to invitation:', error)
        return { error: 'Failed to update invitation' }
    }

    // 3. Notify Workshop (Only if Accepted)
    if (status === 'accepted') {
        // Get user details for the message
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single()

        const userName = profile?.full_name || profile?.email || 'Un usuario'

        // Get tenant staff to notify
        const { data: staffMembers } = await supabase
            .rpc('get_tenant_staff_ids', { p_tenant_id: connection.tenant_id })

        if (staffMembers && staffMembers.length > 0) {
            const notifications = staffMembers.map((staff: any) => ({
                user_id: staff.user_id,
                title: 'Conexión Establecida',
                message: `${userName} ha aceptado la invitación de conexión.`,
                link: '/customers',
                read: false,
                type: 'success'
            }))

            await supabase.from('notifications').insert(notifications)
        }
    }

    revalidatePath('/portal/dashboard')
    revalidatePath('/portal/profile')
    return { success: true }
}

export async function connectWithWorkshopAction(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const tenantId = formData.get('tenantId') as string
    if (!tenantId) return { error: 'Tenant ID required' }

    // Check if connection already exists
    const { data: existingConnection } = await supabase
        .from('tenant_connections')
        .select('id, status')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .single()

    if (existingConnection) {
        if (existingConnection.status === 'rejected') {
            // Retry? Usually blocked. But let's allow re-request.
            const { error } = await supabase
                .from('tenant_connections')
                // Rule: User follows Workshop -> Accepted immediately? 
                // Let's assume 'accepted' for now as per Phase 10 task list.
                .update({ status: 'accepted', initiated_by: 'user' })
                .eq('id', existingConnection.id)

            if (error) return { error: 'Failed to update connection' }
        }
        return { success: true }
    }

    // Create new connection
    const { error } = await supabase
        .from('tenant_connections')
        .insert({
            tenant_id: tenantId,
            user_id: user.id,
            status: 'accepted', // User initiated -> Accepted
            initiated_by: 'user'
        })

    if (error) {
        console.error('Error connecting to workshop:', error)
        return { error: 'Failed to connect' }
    }

    // Notify Workshop Staff
    // reusing the notification logic from respondToInvitationAction
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

    const userName = profile?.full_name || profile?.email || 'Un usuario'

    const { data: staffMembers } = await supabase
        .rpc('get_tenant_staff_ids', { p_tenant_id: tenantId })

    if (staffMembers && staffMembers.length > 0) {
        const notifications = staffMembers.map((staff: any) => ({
            user_id: staff.user_id,
            title: 'Nuevo Cliente Conectado',
            message: `${userName} ha comenzado a seguir tu taller.`,
            link: '/customers',
            read: false,
            type: 'info'
        }))

        await supabase.from('notifications').insert(notifications)
    }

    revalidatePath(`/portal/workshops/${tenantId}`)
    return { success: true }
}
