'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function debugConnectionStateAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No user' }

    // 1. Get Profile & Tenant
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

    // 2. Get All Connections (Ignore status for now)
    const { data: allConnections, error: connError } = await supabase
        .from('tenant_connections')
        .select('*')

    // 3. Get Profiles of those connections
    let profilesFound = []
    if (allConnections && allConnections.length > 0) {
        const ids = allConnections.map(c => c.user_id)
        const { data: profs, error: profError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', ids)
        profilesFound = profs || []
        if (profError) profilesFound.push({ error: profError })
    }

    return {
        user_id: user.id,
        tenant_id: profile?.tenant_id,
        tenant_connections_count: allConnections?.length,
        tenant_connections_raw: allConnections,
        profiles_found: profilesFound,
        conn_error: connError,
        profile_error: null
    }
}
