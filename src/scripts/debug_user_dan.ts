
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkUsers() {
    console.log('Checking Users...')

    // 1. Get recent users
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('Error listing users:', error)
        return
    }

    console.log(`Found ${users.length} users.`)

    for (const user of users) {
        // Fetch profile for this user
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        console.log(`User: ${user.email} | ID: ${user.id}`)
        console.log(`   Metadata:`, user.user_metadata)
        console.log(`   Profile:`, profile)
        console.log('---')
    }
}

checkUsers()
