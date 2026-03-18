import { getProfileAction } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import SalesProfileView from '@/components/features/sales/profile/SalesProfileView'
import { redirect } from 'next/navigation'

export default async function SalesProfilePage() {
    const profile = await getProfileAction()

    // Auth Check
    if (!profile) {
        redirect('/login')
    }

    // Role Check (Middleware does this, but double check doesn't hurt)
    if (profile.role !== 'sales_store' && profile.role !== 'sales_field') {
        // Allow fallback? Or redirect?
    }

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            <h1 className="text-3xl font-bold text-foreground">Configuración de Perfil</h1>

            <SalesProfileView profile={profile} user={user} />
        </div>
    )
}
