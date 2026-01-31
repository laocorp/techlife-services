import { getProfileAction } from '@/lib/actions/profile'
import ProfileForm from '@/components/features/portal/ProfileForm'

export default async function ProfilePage() {
    const profile = await getProfileAction()

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Mi Perfil</h1>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <ProfileForm profile={profile} />
            </div>
        </div>
    )
}
