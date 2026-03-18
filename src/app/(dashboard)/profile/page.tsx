import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/features/profile/ProfileForm'
import { User, ShieldCheck } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
                    <p className="text-muted-foreground">Administra tu información personal y foto de perfil.</p>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                    <h3 className="font-medium text-sm">Cuenta Segura</h3>
                    <p className="text-xs text-muted-foreground">
                        Tu información está protegida. Solo tú y el administrador pueden ver estos cambios.
                    </p>
                </div>
            </div>

            <ProfileForm user={user} profile={profile} />
        </div>
    )
}
