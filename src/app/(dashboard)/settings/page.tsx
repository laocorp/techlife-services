import { getWebhooksAction } from '@/lib/actions/webhooks'
import WebhookList from '@/components/features/settings/WebhookList'
import WorkshopSettingsForm from '@/components/features/settings/WorkshopSettingsForm'
import { Settings as SettingsIcon, Building2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import LocationsManager from '@/components/features/settings/LocationsManager'
import StaffManager from '@/components/features/settings/StaffManager'
import { getBranchesAction, getWarehousesAction } from '@/lib/actions/locations'
import { getStaffAction } from '@/lib/actions/staff'

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    // Parallel Data Fetching
    const [webhooks, branches, warehouses, staff] = await Promise.all([
        getWebhooksAction(),
        getBranchesAction(),
        getWarehousesAction(),
        getStaffAction()
    ])

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
                    <p className="text-muted-foreground">Administra las preferencias de tu cuenta y taller.</p>
                </div>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="locations">Sedes</TabsTrigger>
                    <TabsTrigger value="staff">Personal</TabsTrigger>
                    <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                </TabsList>

                {/* GENERAL: Logo, Colors, Interest Settings */}
                <TabsContent value="general" className="space-y-6">
                    {tenant && <WorkshopSettingsForm tenant={tenant} />}
                </TabsContent>

                {/* LOCATIONS: Branches & Warehouses */}
                <TabsContent value="locations" className="space-y-6">
                    <LocationsManager branches={branches} warehouses={warehouses} />
                </TabsContent>

                {/* STAFF: Roles & Invites */}
                <TabsContent value="staff" className="space-y-6">
                    <StaffManager staff={staff} branches={branches} />
                </TabsContent>

                {/* ADVANCED: Webhooks & API */}
                <TabsContent value="advanced" className="space-y-6">
                    <div className="mb-4">
                        <h3 className="text-lg font-medium">Integraciones (Webhooks)</h3>
                        <p className="text-sm text-muted-foreground">Conecta TechLife con sistemas externos.</p>
                    </div>
                    <WebhookList webhooks={webhooks} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
