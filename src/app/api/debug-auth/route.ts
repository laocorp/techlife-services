import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({
            authStatus: 'Not Logged In',
            error: authError
        })
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return NextResponse.json({
        authStatus: 'Logged In',
        user: {
            id: user.id,
            email: user.email,
            role_metadata: user.app_metadata.role || 'Not Set',
        },
        profile: {
            ...profile,
            role: profile?.role || 'Not Found',
            tenant_id: profile?.tenant_id || 'Not Set',
        },
        profileError
    }, { status: 200 })
}
