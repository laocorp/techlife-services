'use server'

import { createClient } from '@/lib/supabase/server'
import { customerSchema, CustomerFormData } from '@/lib/validations/customers'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCustomerAction(data: CustomerFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Usuario sin taller asignado' }

    const validatedFields = customerSchema.safeParse(data)
    if (!validatedFields.success) return { error: 'Datos inválidos' }

    const { fullName, taxId, email, phone, address } = validatedFields.data

    // 1. Check if user exists globally (using our new RPC)
    if (email) {
        const { data: globalUsers, error: lookupError } = await supabase.rpc('lookup_user_by_email', {
            search_email: email
        })

        if (globalUsers && globalUsers.length > 0) {
            const globalUser = globalUsers[0]

            // Check if connection already exists
            const { data: existingConnection } = await supabase
                .from('tenant_connections')
                .select('status')
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', globalUser.id)
                .single()

            if (existingConnection) {
                if (existingConnection.status === 'accepted') {
                    return { error: 'Ya estás conectado con este usuario.' }
                } else if (existingConnection.status === 'pending') {
                    return { error: 'Ya enviaste una solicitud a este usuario.' }
                }
                // If rejected/blocked, maybe allow retry? keeping it simple for now.
            }

            // Create Pending Connection (Invite)
            const { error: inviteError } = await supabase.from('tenant_connections').insert({
                tenant_id: profile.tenant_id,
                user_id: globalUser.id,
                status: 'pending',
                initiated_by: 'tenant'
            })

            if (inviteError) {
                console.error('Invite Error:', inviteError)
                return { error: 'Error al enviar invitación.' }
            }

            // Create Notification for the user
            const { data: tenant } = await supabase.from('tenants').select('name').eq('id', profile.tenant_id).single()
            await supabase.from('notifications').insert({
                user_id: globalUser.id,
                title: 'Nueva Invitación de Taller',
                message: `${tenant?.name || 'Un taller'} te ha invitado a conectar.`,
                type: 'info',
                link: '/portal/dashboard'
            })

            // OPTIONAL: Still create potential shadow record? 
            // The user requested: "cliente es quien debe aceptar... los talleres no pueden verningun vehiculo"
            // So we should NOT create a local record yet, OR create it but it remains empty/disconnected?
            // "si los clientes no aceptan es solicitud los talleres no pueden verningun vehiculo"
            // This implies the workshop might see the NAME in their list but no assets.
            // Let's create a local customer record linked to the user_id, 
            // BUT since we rely on `tenant_connections` for permissions, the assets won't load.
            // Wait, if we link `user_id`, logic elsewhere might try to load things.
            // Let's just return "Invited" and NOT create the local customer yet. 
            // When they accept, we create the local customer record (synced).
            // OR we create a "Shadow" customer record now, but without `user_id` linked? No, that causes dupe later.
            // PLAN: Just invite. Do NOT add to 'customers' table yet.
            // This means they WON'T appear in the customer list until they accept.
            // The user said: "una vez echa la conexion el taller podra ver..."
            // This implies until then they are not really a "managed" customer.
            // So returning { invited: true } is correct.

            revalidatePath('/customers')
            return { success: true, invited: true }
        }
    }

    // 2. If not found, create "Guest" Customer (Local Record)
    // This is for people who don't have an app account yet.
    const { error } = await supabase.from('customers').insert({
        tenant_id: profile.tenant_id,
        full_name: fullName,
        tax_id: taxId,
        email,
        phone,
        address
    })

    if (error) {
        console.error('Create Customer Error:', error)
        return { error: 'Error al crear cliente' }
    }

    revalidatePath('/customers')
    return { success: true, created: true }
}



export async function searchCustomerByEmailAction(email: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // Use the Secure RPC
    const { data: globalUsers, error } = await supabase.rpc('lookup_user_by_email', {
        search_email: email
    })

    if (error) {
        console.error('Lookup Error:', error)
        return { error: 'Error al buscar usuario.' }
    }

    if (globalUsers && globalUsers.length > 0) {
        const foundUser = globalUsers[0]

        // Check if I (the workshop) already have a connection with this user
        // 1. Get my tenant_id
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

        let connectionStatus = null
        if (profile?.tenant_id) {
            const { data: connection } = await supabase
                .from('tenant_connections')
                .select('status')
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', foundUser.id)
                .single()

            if (connection) {
                connectionStatus = connection.status
            }
        }

        return { found: true, user: foundUser, connectionStatus }
    }

    return { found: false }
}

export async function getCustomersAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    // Need tenant_id to filter connections manually if RLS doesn't suffice (RLS usually does).
    // Assuming RLS handles visibility.

    // 1. Fetch Local Customers (Legacy/Manual)
    const { data: localCustomers, error: localError } = await supabase
        .from('customers')
        .select('*, user_id')
        .order('created_at', { ascending: false })

    if (localError) throw new Error(localError.message)

    // 2. Fetch Connected Users using Secure RPC
    // This bypasses RLS issues on the profiles table

    // First we need the tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        // If no tenant, just return local customers (shouldn't happen for workshop users)
        return localCustomers
    }

    const { data: connections, error: connError } = await supabase
        .rpc('get_tenant_connected_customers', {
            p_tenant_id: profile.tenant_id
        })

    if (connError) console.error('Error fetching connections RPC:', connError)

    // 3. Merge Lists
    const combined = [...localCustomers]
    const existingUserIds = new Set(localCustomers.filter(c => c.user_id).map(c => c.user_id))

    if (connections) {
        console.log('Connections Found (RPC):', connections.length)
        for (const conn of connections) {
            // @ts-ignore
            if (!existingUserIds.has(conn.user_id)) {
                combined.push({
                    id: `virtual-${conn.user_id}`,
                    user_id: conn.user_id,
                    tenant_id: profile.tenant_id,
                    full_name: conn.full_name, // RPC returns this
                    email: 'Email oculto',
                    phone: conn.phone, // RPC now returns this (if updated)
                    address: null,
                    tax_id: null,
                    created_at: conn.created_at,
                    is_virtual: true
                })
            }
        }
    }

    // Sort combined list by created_at desc
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return combined
}

// DELETE ACTION FOR DEBUGGING/MANAGEMENT
export async function deleteCustomerAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // 1. Get my tenant_id
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'No tienes taller' }

    // Case 1: Virtual Customer (Connection)
    if (id.startsWith('virtual-')) {
        const userId = id.replace('virtual-', '')

        // Delete connection
        const { error } = await supabase
            .from('tenant_connections')
            .delete()
            .eq('tenant_id', profile.tenant_id)
            .eq('user_id', userId)

        if (error) {
            console.error('Error deleting connection:', error)
            return { error: 'Error eliminando conexión' }
        }
    }
    // Case 2: Local Customer
    else {
        // First check if this local customer has a user_id linked
        const { data: customer } = await supabase.from('customers').select('user_id').eq('id', id).single()

        if (customer?.user_id) {
            // Also delete the connection if it exists
            await supabase
                .from('tenant_connections')
                .delete()
                .eq('tenant_id', profile.tenant_id)
                .eq('user_id', customer.user_id)
        }

        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)

        if (error) {
            console.error('Error deleting customer:', error)
            return { error: 'Error eliminando cliente' }
        }
    }

    revalidatePath('/customers')
    return { success: true }
}

export async function ensureLocalCustomer(customerId: string) {
    // If it's a real UUID (not virtual), assume it exists
    if (!customerId.startsWith('virtual-')) return customerId

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autorizado')

    // Get tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) throw new Error('No tenant')

    const targetUserId = customerId.replace('virtual-', '')

    // Check if already exists (race condition check)
    const { data: existing } = await supabase.from('customers')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('user_id', targetUserId)
        .maybeSingle()

    if (existing) return existing.id

    // Fetch User Profile Data for the new customer record
    const { data: targetProfile } = await supabase.from('profiles')
        .select('full_name, phone_number, email')
        .eq('id', targetUserId)
        .single()

    // Insert new customer
    const { data: newCustomer, error } = await supabase.from('customers').insert({
        tenant_id: profile.tenant_id,
        user_id: targetUserId, // Link to the user
        full_name: targetProfile?.full_name || 'Cliente Importado',
        phone: targetProfile?.phone_number || '',
        email: targetProfile?.email || null // If available
    }).select('id').single()

    if (error) {
        console.error('Ensure Customer Error:', error)
        throw new Error('Error al importar cliente virtual')
    }

    return newCustomer.id
}
