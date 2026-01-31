'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function debugRpcAction() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { step: 'Auth', error: 'No user found' }

    // 2. Get Profile & Tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) return { step: 'Profile', error: 'No profile found for user', userId: user.id }
    if (!profile.tenant_id) return { step: 'Tenant', error: 'Profile has no tenant_id', profile }

    // 3. Call RPC
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_tenant_connected_customers', {
            p_tenant_id: profile.tenant_id
        })

    // 4. Raw Check (for comparison)
    const { data: rawConnections, error: rawError } = await supabase
        .from('tenant_connections')
        .select('*')
        .eq('tenant_id', profile.tenant_id)

    return {
        user_id: user.id,
        tenant_id: profile.tenant_id,
        rpc_result: rpcData,
        rpc_error: rpcError,
        raw_connections_count: rawConnections?.length,
        raw_connections_sample: rawConnections,
        raw_error: rawError
    }
}
