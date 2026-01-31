'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function connectWithWorkshopAction(formData: FormData) {
    const tenantId = formData.get('tenantId') as string
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect('/auth/login')

    // 1. Create or Update Connection (Status: Accepted because User initiated it)
    const { error: connectionError } = await supabase
        .from('tenant_connections')
        .upsert({
            tenant_id: tenantId,
            user_id: user.id,
            status: 'accepted',
            initiated_by: 'user',
            updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id, user_id' })

    if (connectionError) {
        console.error('Connection Error:', connectionError)
        throw new Error('No se pudo conectar con el taller.')
    }

    // 2. Ensure Local Customer Record exists for the Workshop
    // This allows the workshop to add notes, etc.
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    const name = user.user_metadata?.full_name || profile?.full_name || user.email?.split('@')[0] || 'Cliente Nuevo'

    // Check if customer record exists to avoid overwriting existing local data
    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .single()

    if (!existingCustomer) {
        await supabase.from('customers').insert({
            tenant_id: tenantId,
            user_id: user.id, // Link to global user
            full_name: name,
            email: user.email,
            phone: user.user_metadata?.phone || profile?.phone
        })
    }

    revalidatePath(`/portal/workshops/${tenantId}`)
    revalidatePath('/portal/dashboard')

    return { success: true }
}

export async function respondToInvitationAction(connectionId: number, status: 'accepted' | 'rejected') {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // 1. Verify Connection belongs to user and is pending
    const { data: connection } = await supabase
        .from('tenant_connections')
        .select('*, tenant:tenants(*)')
        .eq('id', connectionId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .single()

    if (!connection) return { error: 'Invitación no encontrada o inválida.' }

    // 2. Update Status
    const { error: updateError } = await supabase
        .from('tenant_connections')
        .update({
            status: status,
            updated_at: new Date().toISOString()
        })
        .eq('id', connectionId)

    if (updateError) {
        console.error('Error updating connection:', updateError)
        return { error: 'Error al procesar la invitación.' }
    }

    // 3. If Accepted, Ensure Local Customer Record Exists
    if (status === 'accepted') {
        const tenantId = connection.tenant_id

        // Check if customer record exists
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('user_id', user.id)
            .single()

        if (!existingCustomer) {
            // Get user profile for defaults
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
            const name = user.user_metadata?.full_name || profile?.full_name || user.email?.split('@')[0] || 'Cliente Conectado'

            await supabase.from('customers').insert({
                tenant_id: tenantId,
                user_id: user.id,
                full_name: name,
                email: user.email,
                phone: user.user_metadata?.phone || profile?.phone
            })
        }
    }

    revalidatePath('/portal/dashboard')
    return { success: true }
}
