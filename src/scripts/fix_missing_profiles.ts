
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function fixMissingProfiles() {
    console.log('Fixing Missing Profiles...')

    // 1. Get all users
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
        console.error('Error listing users:', error)
        return
    }

    for (const user of users) {
        // Check if profile exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (!profile) {
            console.log(`Creating profile for ${user.email} (${user.id})...`)

            // Assume Role = 'client' if missing, unless metadata says otherwise
            // (Owners usually get profile created on signup success)
            const role = user.user_metadata?.role || 'client'

            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || 'Usuario Sin Nombre',
                    role: 'client', // Force client for now for Dan
                    status: 'active'
                })

            if (insertError) {
                console.error('Error creating profile:', insertError)
            } else {
                console.log('Profile created successfully.')
            }
        }
    }
}

fixMissingProfiles()
