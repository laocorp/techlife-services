
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function fixMarketplace() {
    console.log('Fixing Marketplace Visibility...')

    // 1. Update all tenants to be public
    const { data, error } = await supabase
        .from('tenants')
        .update({ is_public: true })
        .neq('id', '00000000-0000-0000-0000-000000000000') // just a condition to match all valid UUIDs
        .select()

    if (error) {
        console.error('Error updating tenants:', error)
    } else {
        console.log(`Updated ${data.length} tenants to public.`)
    }

    // 2. Verify
    const { data: verify, error: verifyError } = await supabase
        .from('tenants')
        .select('id, name, is_public')
        .limit(5)

    if (verifyError) {
        console.error('Error verifying:', verifyError)
    } else {
        console.log('Verification Sample:', verify)
    }
}

fixMarketplace()
