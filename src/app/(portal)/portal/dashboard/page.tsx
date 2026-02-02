import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { MapPin, Car, Info, ArrowRight, Store, Calendar, Users, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PurchaseHistorySection from '@/components/features/portal/PurchaseHistorySection'
import PendingInvitations from '@/components/features/portal/PendingInvitations'
import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

export default async function ConsumerHubPage() {


    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8 text-center text-slate-500">Debes iniciar sesión para ver tu Hub.</div>
    }

    // 0. Get User Profile & Name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, created_at')
        .eq('id', user.id)
        .single()

    let userName = profile?.full_name || user.user_metadata?.full_name
    let avatarUrl = profile?.avatar_url

    // Fallback if no profile record
    if (!userName) {
        const { data: firstCustomer } = await supabase.from('customers').select('full_name, avatar_url').eq('user_id', user.id).limit(1).single()
        userName = firstCustomer?.full_name?.split(' ')[0]
        if (!avatarUrl) avatarUrl = firstCustomer?.avatar_url
    }

    // Helper for Storage URL
    const getStorageUrl = (path: string | null, bucket: string = 'branding') => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
    }

    const displayAvatarUrl = getStorageUrl(avatarUrl)

    // 1. Fetch Pending Invitations
    const { data: pendingInvitations } = await supabase
        .from('tenant_connections')
        .select(`
            id,
            created_at,
            tenant:tenants (
                id,
                name,
                industry,
                logo_url
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')

    // 2. Fetch Linked Workshops
    const { data: linkedCustomers } = await supabase
        .from('customers')
        .select(`
            id,
            tenant:tenants (
                id,
                name,
                industry,
                logo_url
            ),
            service_orders (count)
        `)
        .eq('user_id', user.id)

    // 3. Fetch Personal Assets
    const { data: personalAssets } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

    // 4. Counts for Stats
    const workshopCount = linkedCustomers?.length || 0
    // Approximate assets count (this logic could be improved but sufficient for display)
    const { count: personalCount } = await supabase.from('user_assets').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
    const totalAssets = (personalCount || 0)

    // 5. Fetch Ecommerce Orders
    const { data: purchaseOrders } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    return (
        <div className="max-w-5xl mx-auto pb-12">

            {/* --- HERO PROFILE HEADER --- */}
            <div className="relative mb-8">
                {/* Banner Gradient */}
                <div className="h-48 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-b-3xl shadow-md"></div>

                {/* Profile Container */}
                <div className="px-6 md:px-12 flex flex-col md:flex-row items-end -mt-16 gap-6">
                    {/* Avatar */}
                    <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden shrink-0 relative">
                        {displayAvatarUrl ? (
                            <img src={displayAvatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                                <Users className="h-12 w-12" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pt-2 md:translate-y-4 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-foreground">{userName || 'Usuario TechLife'}</h1>
                        <p className="text-muted-foreground font-medium">Miembro desde {new Date(profile?.created_at || user.created_at).getFullYear()}</p>
                    </div>

                    {/* Quick Action */}
                    <div className="pb-4 hidden md:block">
                        <Link href="/portal/profile">
                            <Button variant="outline" className="bg-background/80 backdrop-blur-sm border-border hover:bg-background text-foreground">
                                Editar Perfil
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="mt-8 px-6 md:px-12 grid grid-cols-3 gap-4 border-b border-border pb-8">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{totalAssets}</div>
                        <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Vehículos</div>
                    </div>
                    <div className="text-center border-l border-border">
                        <div className="text-2xl font-bold text-foreground">{workshopCount}</div>
                        <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Talleres</div>
                    </div>
                    <div className="text-center border-l border-border">
                        <div className="text-2xl font-bold text-foreground">0</div>
                        <div className="text-sm text-muted-foreground uppercase tracking-wide font-medium">Puntos</div>
                    </div>
                </div>
            </div>

            <div className="px-4 space-y-8">
                {/* Pending Invitations Alert */}
                <PendingInvitations invitations={pendingInvitations as any[] || []} />

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Main Activity */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* GARAGE PREVIEW */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <Car className="h-5 w-5 text-indigo-500" />
                                    Mi Garaje
                                </h2>
                                <Link href="/portal/garage" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Ver todo</Link>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {personalAssets && personalAssets.length > 0 ? (
                                    personalAssets.map((asset) => (
                                        <Link key={asset.id} href={`/portal/garage/${asset.identifier}`}>
                                            <Card className="hover:shadow-md transition-all cursor-pointer border-border group">
                                                <CardContent className="p-4 flex gap-4">
                                                    <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                        <Car className="h-6 w-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-foreground line-clamp-1">{asset.alias || asset.identifier}</h4>
                                                        <p className="text-sm text-muted-foreground">{asset.details?.make} {asset.details?.model}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-2 bg-muted/50 border border-dashed rounded-xl p-6 text-center">
                                        <p className="text-muted-foreground mb-4">No tienes vehículos registrados.</p>
                                        <Link href="/portal/garage/new">
                                            <Button variant="outline">Agregar Vehículo</Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* PURCHASES */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5 text-pink-500" />
                                    Compras Recientes
                                </h2>
                            </div>
                            <PurchaseHistorySection orders={purchaseOrders as any[] || []} />
                        </section>

                    </div>

                    {/* RIGHT COLUMN: Sidebar / Workshops */}
                    <div className="space-y-8">

                        {/* MARKETPLACE PROMO */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">¿Necesitas ayuda experta?</h3>
                                <p className="text-indigo-100 text-sm mb-4">Encuentra los mejores talleres certificados cerca de ti.</p>
                                <Link href="/portal/marketplace">
                                    <Button size="sm" className="bg-white text-indigo-600 hover:bg-indigo-50 border-0">
                                        Explorar Marketplace
                                    </Button>
                                </Link>
                            </div>
                            {/* Decorative Circle */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        </div>

                        {/* LINKED WORKSHOPS */}
                        <section>
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Store className="h-5 w-5 text-orange-500" />
                                Mis Talleres
                            </h2>
                            <div className="space-y-3">
                                {linkedCustomers && linkedCustomers.length > 0 ? (
                                    linkedCustomers.map((c: any) => c.tenant && (
                                        <Link key={c.id} href={`/portal/workshops/${c.tenant.id}`}>
                                            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors">
                                                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                                    {c.tenant.logo_url ? (
                                                        <img src={getStorageUrl(c.tenant.logo_url)!} className="w-full h-full object-cover" alt={c.tenant.name} />
                                                    ) : (
                                                        <span className="font-bold text-muted-foreground text-xs">{c.tenant.name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-foreground truncate">{c.tenant.name}</h4>
                                                    <p className="text-xs text-muted-foreground truncate">{c.tenant.industry}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-4">No estás unido a ningún taller.</div>
                                )}
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    )
}
