'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function sendConnectionRequestAction(userId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('No tenant found')

    // Check if connection exists
    const { data: existing } = await supabase
        .from('tenant_connections')
        .select('status')
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', userId)
        .single()

    if (existing) {
        if (existing.status === 'accepted') return { error: 'El usuario ya está conectado.' }
        if (existing.status === 'pending') return { error: 'Ya existe una solicitud pendiente.' }
        if (existing.status === 'blocked') return { error: 'No se puede conectar con este usuario.' }
        // If rejected, maybe allow retry? For now, just error.
        if (existing.status === 'rejected') return { error: 'El usuario rechazó la conexión previamente.' }
    }

    // Create Connection Request
    const { error } = await supabase
        .from('tenant_connections')
        .insert({
            tenant_id: profile.tenant_id,
            user_id: userId,
            status: 'pending',
            initiated_by: 'tenant'
        })

    if (error) {
        console.error('Error creating connection:', error)
        return { error: 'Error al enviar solicitud.' }
    }

    // TODO: Create Notification for User?
    // Trigger notification manually since we don't have a DB trigger for this specific case yet?
    // "El Taller X te ha enviado una solicitud de conexión"
    // Let's rely on the Realtime Notifications (Fase 8) if possible, or add it here.
    // For now, let's just insert the notification directly to be safe.

    await supabase.from('notifications').insert({
        user_id: userId,
        title: 'Nueva Solicitud de Conexión',
        message: 'Un taller quiere conectarse contigo para compartir historial de servici.',
        type: 'info',
        link: '/portal/profile', // Or wherever requests are managed
        read: false
    })

    revalidatePath('/dashboard/customers')
    return { success: true }
}

export async function lookupUserAction(email: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Use the Secure RPC
    const { data, error } = await supabase.rpc('lookup_user_by_email', { search_email: email })

    if (error) {
        console.error('Lookup failed:', error)
        return null
    }

    // RPC returns array (table function)
    if (data && data.length > 0) {
        return data[0] // { id, full_name, avatar_url }
    }

    return null
}

export async function respondToInvitationAction(connectionId: string, accept: boolean) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const status = accept ? 'accepted' : 'rejected'

    const { error } = await supabase
        .from('tenant_connections')
        .update({ status })
        .eq('id', connectionId)
        .eq('user_id', user.id) // Security: Ensure own connection

    if (error) {
        console.error('Error responding to invitation:', error)
        return { error: 'Error al responder la invitación' }
    }

    revalidatePath('/portal/profile')
    return { success: true }
}

export async function connectWithWorkshopAction(tenantId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Check if connection exists
    const { data: existing } = await supabase
        .from('tenant_connections')
        .select('status')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        if (existing.status === 'accepted') return { error: 'Ya estás conectado con este taller.' }
        if (existing.status === 'pending') return { error: 'Ya enviaste una solicitud.' }
        if (existing.status === 'blocked') return { error: 'No puedes conectar con este taller.' }
    }

    // Create Connection (User initiated -> Status: accepted)
    // We assume if a user wants to connect to a public workshop, it's auto-accepted for now.
    // Or it could be 'pending' if the workshop needs to approve.
    // Based on "Insertar conexión con estado accepted (iniciada por usuario)" in task list:
    const { error } = await supabase
        .from('tenant_connections')
        .insert({
            tenant_id: tenantId,
            user_id: user.id,
            status: 'accepted',
            initiated_by: 'user'
        })

    if (error) {
        console.error('Error connecting with workshop:', error)
        return { error: 'Error al conectar con el taller.' }
    }

    revalidatePath(`/portal/workshops/${tenantId}`)
    revalidatePath('/portal/profile')
    return { success: true }
}
