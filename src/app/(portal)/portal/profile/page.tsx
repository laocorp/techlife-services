import { getProfileAction } from '@/lib/actions/profile'
import ProfileForm from '@/components/features/portal/ProfileForm'
import PendingInvitations from '@/components/features/portal/PendingInvitations'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import CustomerProfileCard from '@/components/portal/CustomerProfileCard'
import SecurityForm from '@/components/features/portal/SecurityForm'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
    const profile = await getProfileAction()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Pending Invitations
    const { data: invitations } = await supabase
        .from('tenant_connections')
        .select(`
            id,
            created_at,
            tenant:tenants (
                id,
                name,
                industry,
                logo_url
            )
        `)
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Configuración de Cuenta</h1>

            {/* Pending Invitations */}
            {invitations && invitations.length > 0 && (
                <PendingInvitations invitations={invitations as any} />
            )}

            <div className="grid md:grid-cols-3 gap-8">
                {/* Left Column: Avatar & Basic Identity */}
                <div className="md:col-span-1 space-y-6">
                    <CustomerProfileCard user={user} avatarUrl={profile.avatar_url} />
                </div>

                {/* Right Column: Forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Personal Info */}
                    <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Información Personal</h2>
                        <ProfileForm profile={profile} />
                    </div>

                    {/* Security */}
                    <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Seguridad</h2>
                        <SecurityForm />
                    </div>
                </div>
            </div>
        </div>
    )
}
