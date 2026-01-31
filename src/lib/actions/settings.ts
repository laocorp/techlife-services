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

    // Bank Details
    const bank_account = {
        bank_name: formData.get('bank_name') as string,
        account_type: formData.get('account_type') as string,
        account_number: formData.get('account_number') as string,
        account_holder: formData.get('account_holder') as string,
        holder_id: formData.get('holder_id') as string // Cédula/RUC
    }

    // Fetch current settings to merge
    const { data: tenant } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', profile.tenant_id)
        .single()

    const currentSettings = tenant?.settings || {}
    const newSettings = {
        ...currentSettings,
        bank_account // Namespace it
    }

    const { error } = await supabase
        .from('tenants')
        .update({
            name,
            address,
            city,
            contact_email,
            contact_phone,
            website,
            settings: newSettings,
            updated_at: new Date().toISOString()
        })
        .eq('id', profile.tenant_id)

    if (error) {
        throw new Error('Failed to update tenant')
    }

    revalidatePath('/settings')
    revalidatePath('/portal/orders/[id]', 'page') // Revalidate order pages to show new info
}
