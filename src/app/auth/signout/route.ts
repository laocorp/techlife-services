import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
    return handleSignOut(req)
}

export async function GET(req: NextRequest) {
    return handleSignOut(req)
}

async function handleSignOut(req: NextRequest) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Check if we have a session
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
        await supabase.auth.signOut()
    }

    // Force revalidation of all paths to clear cache
    revalidatePath('/', 'layout')

    return NextResponse.redirect(new URL('/login', req.url), {
        status: 302,
    })
}
