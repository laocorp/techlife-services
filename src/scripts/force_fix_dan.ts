
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function forceFixDan() {
    console.log('Force Fixing Profile for beta2@taller.com...')

    // 1. Find the user
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    // List all users to find the match
    console.log("Listing all users to find match for 'Danhelic2011paypal@gmail.com'...")
    users.forEach(u => console.log(` - ${u.email}`))

    const targetUser = users.find(u => u.email?.toLowerCase() === 'danhelic2011paypal@gmail.com')

    if (!targetUser) {
        console.error('User NOT FOUND even with case-insensitive search.')
        return
    }

    console.log(`Found User: ${targetUser.id} (${targetUser.email})`)

    // 2. Upsert Profile
    const { data, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
            id: targetUser.id,
            full_name: 'Dan (Cliente)',
            role: 'client',
            status: 'active',
            tenant_id: null // Explicitly null for global client
        })
        .select()

    if (upsertError) {
        console.error('Error upserting profile:', upsertError)
    } else {
        console.log('Profile fixed successfully:', data)
    }
}

forceFixDan()
