import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function triggerWebhook(eventType: string, payload: any) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return

    // Find active webhooks for this event
    const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .eq('event_type', eventType)

    if (!webhooks || webhooks.length === 0) return

    // Execute in "background" (no await here would be ideal, but Vercel functions might kill it. 
    // Best effort: await Promise.allSettled)

    await Promise.allSettled(webhooks.map(async (hook) => {
        try {
            const response = await fetch(hook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': hook.secret || '',
                    'X-Event-Type': eventType
                },
                body: JSON.stringify({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    event: eventType,
                    data: payload
                })
            })

            // Log result (Fire and forget, but inside this promise)
            await supabase.from('webhook_logs').insert({
                webhook_id: hook.id,
                event_type: eventType,
                payload: payload,
                response_status: response.status,
                success: response.ok
            })

        } catch (err: any) {
            console.error(`Webhook failed ${hook.url}`, err)
            // Log failure
            await supabase.from('webhook_logs').insert({
                webhook_id: hook.id,
                event_type: eventType,
                payload: payload,
                response_status: 0,
                response_body: err.message,
                success: false
            })
        }
    }))
}
