import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debug() {
    const { data: tenants, error } = await supabase.from('tenants').select('*')
    if (error) {
        console.error('Error fetching tenants:', error)
        return
    }
    console.log(`Found ${tenants.length} tenants:`)
    console.table(tenants.map(t => ({ id: t.id.substring(0,8), name: t.name, industry: t.industry, is_public: t.is_public })))
}

debug()
