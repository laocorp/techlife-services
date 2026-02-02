
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function checkStorage() {
    console.log('Checking Storage Buckets...')

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error)
        return
    }

    console.log('Buckets:', buckets.map(b => ({ name: b.name, public: b.public })))

    const brandingBucket = buckets.find(b => b.name === 'branding')

    if (!brandingBucket) {
        console.warn('WARNING: "branding" bucket NOT FOUND!')
    } else {
        console.log('"branding" bucket found.')
    }
}

checkStorage()
