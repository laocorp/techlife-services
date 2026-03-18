
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTable() {
    console.log('Checking if tenant_connections table exists...')
    const { data, error } = await supabase
        .from('tenant_connections')
        .select('id')
        .limit(1)

    if (error) {
        console.error('Error:', error.message)
        if (error.code === '42P01') { // undefined_table
            console.log('Table does NOT exist.')
        } else {
            console.log('Table might exist but errored:', error.code)
        }
    } else {
        console.log('Table EXISTS.')
    }
}

checkTable()
