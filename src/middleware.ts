import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Protected routes (Dashboard & Sales)
    if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/sales')) {
        if (!user) {
            return NextResponse.redirect(new URL('/login', request.url))
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Strict Role Separation for /dashboard
        if (request.nextUrl.pathname.startsWith('/dashboard')) {
            if (profile?.role === 'client') {
                return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            } else if (profile?.role === 'sales_store' || profile?.role === 'sales_field') {
                return NextResponse.redirect(new URL('/sales/catalog', request.url))
            }
        }
    }

    // --- NEW: Block Restricted Routes for Non-Admins ---

    // 0. Profile (Protected for all authenticated users)
    if (request.nextUrl.pathname.startsWith('/profile')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))
        // No role check needed, everyone has a profile
    }

    // 1. Settings, Analytics (Strict Admin Only)
    const strictAdminRoutes = ['/settings', '/analytics', '/sales-metrics']
    if (strictAdminRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const allowed = ['owner', 'manager', 'head_technician']

        if (profile && !allowed.includes(profile.role)) {
            if (profile.role === 'client') return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            if (['sales_store', 'sales_field'].includes(profile.role)) return NextResponse.redirect(new URL('/sales/catalog', request.url))
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // 1.5. Finance (Admins + Receptionist)
    if (request.nextUrl.pathname.startsWith('/finance')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const allowed = ['owner', 'manager', 'head_technician', 'receptionist']

        if (profile && !allowed.includes(profile.role)) {
            if (profile.role === 'client') return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            if (['sales_store', 'sales_field'].includes(profile.role)) return NextResponse.redirect(new URL('/sales/catalog', request.url))
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // 2. Inventory (Admins + Warehouse + Technician)
    if (request.nextUrl.pathname.startsWith('/inventory')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        // Technicians can view inventory too (to see parts) + Receptionist
        const allowed = ['owner', 'manager', 'head_technician', 'warehouse_keeper', 'technician', 'receptionist']

        if (profile && !allowed.includes(profile.role)) {
            if (profile.role === 'client') return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            if (['sales_store', 'sales_field'].includes(profile.role)) return NextResponse.redirect(new URL('/sales/catalog', request.url))
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // 3. Customers (Admins + Reception)
    if (request.nextUrl.pathname.startsWith('/customers')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const allowed = ['owner', 'manager', 'head_technician', 'receptionist']

        if (profile && !allowed.includes(profile.role)) {
            if (profile.role === 'client') return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            if (['sales_store', 'sales_field'].includes(profile.role)) return NextResponse.redirect(new URL('/sales/catalog', request.url))
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // 4. POS (Admins only - Sales use /sales routes)
    if (request.nextUrl.pathname.startsWith('/pos')) {
        if (!user) return NextResponse.redirect(new URL('/login', request.url))

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        const allowed = ['owner', 'manager', 'receptionist']

        if (profile && !allowed.includes(profile.role)) {
            if (profile.role === 'client') return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            if (['sales_store', 'sales_field'].includes(profile.role)) return NextResponse.redirect(new URL('/sales/catalog', request.url))
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }
    // ---------------------------------------------------

    // Portal routes (Restrict non-clients)
    if (request.nextUrl.pathname.startsWith('/portal') && user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile && profile.role !== 'client') {
            if (profile.role === 'sales_store' || profile.role === 'sales_field') {
                return NextResponse.redirect(new URL('/sales/catalog', request.url))
            }
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    // Auth routes (redirect if already logged in)
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')) {
        if (user) {
            // Check user role to determine redirect destination
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile?.role === 'client') {
                return NextResponse.redirect(new URL('/portal/dashboard', request.url))
            } else if (profile?.role === 'sales_store' || profile?.role === 'sales_field') {
                return NextResponse.redirect(new URL('/sales/catalog', request.url))
            }

            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
