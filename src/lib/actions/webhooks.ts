'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface Webhook {
    id: string
    name: string
    url: string
    event_type: string
    is_active: boolean
    secret?: string
    created_at: string
}

export async function getWebhooksAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data } = await supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    return data as Webhook[]
}

export async function createWebhookAction(data: { name: string, url: string, event_type: string, secret?: string }) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    if (!profile?.tenant_id) return { error: 'No tenant' }

    const { error } = await supabase.from('webhooks').insert({
        tenant_id: profile.tenant_id,
        name: data.name,
        url: data.url,
        event_type: data.event_type,
        secret: data.secret,
        is_active: true
    })

    if (error) {
        console.log("Create webhook error", error)
        return { error: 'Failed to create webhook' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteWebhookAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.from('webhooks').delete().eq('id', id)

    if (error) return { error: 'Failed to delete' }

    revalidatePath('/settings')
    return { success: true }
}

export async function toggleWebhookAction(id: string, currentState: boolean) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.from('webhooks').update({ is_active: !currentState }).eq('id', id)

    if (error) return { error: 'Failed to update' }

    revalidatePath('/settings')
    return { success: true }
}
