import { getProfileAction } from '@/lib/actions/profile'
import ProfileForm from '@/components/features/portal/ProfileForm'
import PendingInvitations from '@/components/features/portal/PendingInvitations'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function ProfilePage() {
    const profile = await getProfileAction()
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

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
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Mi Perfil</h1>

            {/* Pending Invitations Section */}
            {invitations && invitations.length > 0 && (
                <PendingInvitations invitations={invitations as any} />
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <ProfileForm profile={profile} />
            </div>
        </div>
    )
}
