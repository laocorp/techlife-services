'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function updateTenantProfile(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get Tenant ID
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) throw new Error('No tenant found')

    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const contact_email = formData.get('contact_email') as string
    const contact_phone = formData.get('contact_phone') as string
    const website = formData.get('website') as string

    const { error } = await supabase
        .from('tenants')
        .update({
            name,
            address,
            city,
            contact_email,
            contact_phone,
            website,
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.tenant_id)

    if (error) {
        throw new Error('Failed to update tenant')
    }

    revalidatePath('/settings')
    revalidatePath('/portal/orders/[id]', 'page') // Revalidate order pages to show new info
}
