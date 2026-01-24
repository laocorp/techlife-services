'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getWebhooksAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // RLS handles tenant filtering
    const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false })

    return webhooks || []
}

export async function createWebhookAction(data: { url: string; eventType: string; description: string }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) throw new Error('No tenant found')

    const { error } = await supabase.from('webhooks').insert({
        tenant_id: profile.tenant_id,
        url: data.url,
        event_type: data.eventType,
        description: data.description,
        created_by: user.id
    })

    if (error) {
        console.error('Error creating webhook:', error)
        throw new Error('Failed to create webhook')
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteWebhookAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting webhook:', error)
        throw new Error('Failed to delete webhook')
    }

    revalidatePath('/settings')
    return { success: true }
}
