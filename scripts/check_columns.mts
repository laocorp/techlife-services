import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const { data, error } = await supabase.from('tenants').select('*').limit(1)
    if (error) {
        console.error('Error fetching tenants:', error)
        return
    }
    console.log('Tenant columns:', Object.keys(data[0] || {}))
    console.log('Sample tenant:', data[0])
}

debug()
