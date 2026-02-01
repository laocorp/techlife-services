import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { MapPin, Car, Info, ArrowRight, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import PurchaseHistorySection from '@/components/features/portal/PurchaseHistorySection'
import PendingInvitations from '@/components/features/portal/PendingInvitations'
import React from 'react'

export default async function ConsumerHubPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8 text-center text-slate-500">Debes iniciar sesión para ver tu Hub.</div>
    }

    // 0. Get User Name
    let userName = user.user_metadata?.full_name
    if (!userName) {
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
        userName = profile?.full_name
    }
    if (!userName) {
        const { data: firstCustomer } = await supabase.from('customers').select('full_name').eq('user_id', user.id).limit(1).single()
        userName = firstCustomer?.full_name?.split(' ')[0]
    }

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

    const getLogoUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
    }

    // 3. Fetch Personal Assets
    const { data: personalAssets } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3)

    // 4. Fetch Workshop Assets
    const { data: rawWorkshopAssets } = await supabase
        .from('customer_assets')
        .select(`
            id,
            identifier,
            details,
            created_at,
            customers (
                user_id,
                tenant_id
            )
        `)
        .limit(10)

    let workshopAssets: any[] = []
    if (rawWorkshopAssets) {
        workshopAssets = await Promise.all(rawWorkshopAssets.map(async (asset: any) => {
            const customerData = asset.customers
            if (customerData?.tenant_id) {
                const { data: tenantData } = await supabase.from('tenants').select('name').eq('id', customerData.tenant_id).single()
                if (tenantData) {
                    customerData.tenant = tenantData
                }
            }
            return { ...asset, customer: customerData }
        }))
    }

    // 5. Fetch Ecommerce Orders
    const { data: purchaseOrders } = await supabase
        .from('ecommerce_orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

    // Merge and Deduplicate Assets
    const assetMap = new Map<string, any>()

    // 1. Process Personal Assets (Priority)
    personalAssets?.forEach(asset => {
        assetMap.set(asset.identifier, {
            ...asset,
            source: 'Personal',
            tenantNames: [],
            isPersonal: true
        })
    })

    // 2. Process Workshop Assets (Merge if identifier matches)
    workshopAssets?.forEach((asset: any) => {
        const existing = assetMap.get(asset.identifier)
        const tenantName = asset.customer?.tenant?.name

        if (existing) {
            // Asset exists (Personal), just tag the workshop
            if (tenantName && !existing.tenantNames.includes(tenantName)) {
                existing.tenantNames.push(tenantName)
            }
            // If it was only a workshop asset before (unlikely in this order but possible if logic changes), mark source
        } else {
            // New Workshop Asset
            assetMap.set(asset.identifier, {
                id: asset.id, // ID of the workshop asset (customer_asset)
                identifier: asset.identifier,
                details: asset.details,
                created_at: asset.created_at,
                source: 'Taller',
                tenantNames: tenantName ? [tenantName] : [],
                alias: null, // Workshop assets usually don't have user aliases
                isPersonal: false
            })
        }
    })

    const allAssets = Array.from(assetMap.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3)

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Hola, {userName || 'Usuario'}</h1>
                    <p className="text-slate-500">Bienvenido a tu Hub de TechLife.</p>
                </div>
                <Link href="/portal/marketplace">
                    <span className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
                        <Store className="h-4 w-4" />
                        Explorar Talleres
                    </span>
                </Link>
            </div>

            {/* PENDING INVITATIONS */}
            <PendingInvitations invitations={pendingInvitations as any[] || []} />

            {/* MY GARAGE PREVIEW */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Mi Garaje</h2>
                    <Link href="/portal/garage" className="text-sm font-medium text-indigo-600 hover:underline">Ver todo</Link>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {allAssets && allAssets.length > 0 ? (
                        allAssets.map((asset) => (
                            <Link key={asset.id} href={`/portal/garage/${asset.identifier}`} className="block">
                                <Card className="bg-slate-50 border-0 shadow-sm relative overflow-hidden transition-shadow hover:shadow-md">
                                    <div className="absolute top-0 right-0 flex flex-col items-end">
                                        {asset.tenantNames?.map((name: string) => (
                                            <div key={name} className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-bl-md font-medium mb-[1px]">
                                                {name}
                                            </div>
                                        ))}
                                    </div>
                                    <CardContent className="p-4 flex items-start gap-3">
                                        <div className={`p-2 rounded-md shadow-sm ${!asset.isPersonal ? 'bg-orange-50 text-orange-600' : 'bg-white text-indigo-600'}`}>
                                            <Car className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900">{asset.alias || asset.identifier}</h4>
                                            <p className="text-xs text-slate-500">{asset.details?.make || '-'} {asset.details?.model} {asset.details?.year}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-3 text-sm text-slate-400 italic">
                            No tienes activos registrados. Agrega tu auto o equipo en "Mi Garaje".
                        </div>
                    )}
                </div>
            </section>

            {/* MY WORKSHOPS */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Mis Talleres Vinculados</h2>
                </div>
                {linkedCustomers && linkedCustomers.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {linkedCustomers.map((c: any) => c.tenant && (
                            <Link key={c.id} href={`/portal/workshops/${c.tenant.id}`}>
                                <Card className="hover:shadow-md transition-shadow cursor-pointer border-slate-200">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-400 uppercase">
                                            {c.tenant.logo_url ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={getLogoUrl(c.tenant.logo_url)!} className="h-full w-full object-cover rounded-full" />
                                            ) : (
                                                c.tenant.name[0]
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle>{c.tenant.name}</CardTitle>
                                            <CardDescription className="capitalize">{c.tenant.industry || 'Servicio General'}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Info className="h-4 w-4" />
                                                {(c.service_orders?.[0]?.count || 0)} Órdenes Previas
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-slate-300" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-dashed rounded-lg p-8 text-center text-slate-500">
                        No estás vinculado a ningún taller aún. ¡Busca uno en el Marketplace!
                    </div>
                )}
            </section>

            {/* MY PURCHASES */}
            <React.Suspense fallback={<div className="p-4 text-center">Cargando historial...</div>}>
                <PurchaseHistorySection orders={purchaseOrders as any[] || []} />
            </React.Suspense>
        </div>
    )
}
