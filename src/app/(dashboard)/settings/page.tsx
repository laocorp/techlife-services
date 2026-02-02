import { getWebhooksAction } from '@/lib/actions/webhooks'
import WebhookList from '@/components/features/settings/WebhookList'
import WorkshopSettingsForm from '@/components/features/settings/WorkshopSettingsForm'
import { Settings as SettingsIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function SettingsPage() {
    const webhooks = await getWebhooksAction()

    // Fetch Tenant Info
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    // Get tenant ID from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    let tenant = null
    if (profile?.tenant_id) {
        const { data: tenantData } = await supabase.from('tenants').select('*').eq('id', profile.tenant_id).single()
        tenant = tenantData
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-slate-900 rounded-lg text-white">
                    <SettingsIcon className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
                    <p className="text-muted-foreground">Administra las preferencias de tu cuenta.</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Workshop Profile Settings */}
                {tenant && <WorkshopSettingsForm tenant={tenant} />}

                {/* Webhooks Section */}
                <WebhookList webhooks={webhooks} />
            </div>
        </div>
    )
}
