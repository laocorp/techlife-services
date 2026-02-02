
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const LOG_FILE = 'debug_log.json'
const logs: any[] = []

function log(msg: string, data?: any) {
    console.log(msg, data || '')
    logs.push({ msg, data })
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2))
}

async function deepDebugStorage() {
    log('--- Deep Debug Storage ---')

    // 1. List Buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
        log('CRITICAL: Error listing buckets:', error)
        return
    }

    if (!buckets || buckets.length === 0) {
        log('WARNING: No buckets found!')
    } else {
        log(`Found ${buckets.length} bucket(s):`)
        buckets.forEach(b => {
            log(`BUCKET: ${b.name}`, {
                id: b.id,
                public: b.public,
                allowed_mime_types: b.allowed_mime_types,
                file_size_limit: b.file_size_limit
            })
        })
    }

    // 2. Test Upload to 'branding'
    const bucketName = 'branding'
    // Ensure bucket exists in the list
    const targetBucket = buckets.find(b => b.name === bucketName)

    if (!targetBucket) {
        log(`ERROR: Bucket '${bucketName}' does not exist! This is likely the root cause.`)
        return
    }

    const testFileName = `debug_test_${Date.now()}.txt`
    const testContent = 'This is a test file to verify write access.'

    log(`Attempting Test Upload to '${bucketName}' via Service Role...`)

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testContent, {
            contentType: 'text/plain',
            upsert: true
        })

    if (uploadError) {
        log('Upload Failed:', uploadError)
    } else {
        log('Upload SUCCEEDED:', uploadData)

        // 3. Test Public URL
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(testFileName)

        log('Generated Public URL:', publicUrlData.publicUrl)

        // Cleanup
        await supabase.storage.from(bucketName).remove([testFileName])
        log('Cleanup: Test file removed.')
    }
}

deepDebugStorage()
