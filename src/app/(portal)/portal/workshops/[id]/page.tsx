import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'


import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Phone, Mail, Clock, ShieldCheck, ArrowLeft, Star } from 'lucide-react'

// This would be a server action in a real app
import { redirect } from 'next/navigation'
import { getTenantPublicProductsAction } from '@/lib/actions/store'
import AddToCartButton from '@/components/features/store/AddToCartButton'
import WorkshopProductControls from '@/components/features/store/WorkshopProductControls'
import { ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CardFooter } from '@/components/ui/card'

async function connectToWorkshop(formData: FormData) {
    'use server'
    const tenantId = formData.get('tenantId') as string
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Check if already connected
    const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        // Already connected
        return redirect('/portal/dashboard')
    }

    // Create Customer profile linked to this user
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single() // Assuming profile exists or use auth meta

    // Fallback name if no profile
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Nuevo Cliente'

    await supabase.from('customers').insert({
        tenant_id: tenantId,
        user_id: user.id,
        full_name: name,
        email: user.email,
        phone: user.user_metadata?.phone
    })

    redirect('/portal/dashboard')
}

export default async function WorkshopProfilePage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ q?: string; category?: string }>
}) {
    const { id } = await params
    const { q, category } = await searchParams
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch Tenant Details
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .eq('is_public', true)
        .single()

    // Fetch Products
    const products = await getTenantPublicProductsAction(id, q, category)

    // Fetch unique categories (Optimization: In real app, use a distinct query)
    const { data: allTenantProducts } = await supabase
        .from('products')
        .select('category')
        .eq('tenant_id', id)
        .eq('is_public', true)

    const uniqueCategories = Array.from(new Set(allTenantProducts?.map(p => p.category) || [])).filter(Boolean).sort()
    const categories = uniqueCategories.map(c => ({ name: c, id: c }))

    // Helper for Logo URL

    // Helper for Logo URL
    const getLogoUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
    }
    const tenantLogo = tenant ? getLogoUrl(tenant.logo_url) : null

    if (!tenant) {
        return notFound()
    }

    // Check connection status
    let isConnected = false
    if (user) {
        const { data: connection } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', id)
            .eq('user_id', user.id)
            .single()
        if (connection) isConnected = true
    }

    return (
        <div className="bg-slate-50 min-h-screen pb-12">
            {/* HERO COVER */}
            <div className="h-64 bg-slate-900 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full max-w-5xl mx-auto px-4 pb-8 flex items-end gap-6">
                    <div className="h-32 w-32 bg-white rounded-xl shadow-lg p-1 flex items-center justify-center text-4xl font-bold text-slate-300">
                        {tenantLogo ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={tenantLogo}
                                    alt="Logo"
                                    fill
                                    sizes="(max-width: 768px) 128px, 128px"
                                    className="object-cover rounded-lg"
                                />
                            </div>
                        ) : (
                            tenant.name[0]
                        )}
                    </div>
                    <div className="text-white pb-2">
                        <h1 className="text-4xl font-bold">{tenant.name}</h1>
                        <p className="text-slate-300 flex items-center gap-2 mt-1">
                            <ShieldCheck className="h-4 w-4 text-green-400" />
                            Taller Verificado • {tenant.industry.toUpperCase()}
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 mt-8 grid md:grid-cols-3 gap-8">
                {/* LEFT COL: INFO */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-xl font-bold text-slate-900">Sobre Nosotros</h2>
                            <p className="text-slate-600 leading-relaxed">
                                {tenant.description || "Este taller no ha agregado una descripción pública todavía, pero están listos para atenderte."}
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4 py-4">
                                <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin className="h-5 w-5 text-indigo-500" />
                                    <span>{tenant.public_address || "Dirección no disponible"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Phone className="h-5 w-5 text-indigo-500" />
                                    <span>{tenant.contact_phone || "Teléfono no disponible"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Mail className="h-5 w-5 text-indigo-500" />
                                    <span>{tenant.contact_email || "Email no disponible"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600">
                                    <Clock className="h-5 w-5 text-indigo-500" />
                                    <span>Lun - Vie: 9:00 - 18:00</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">Servicios Destacados</h2>
                            <div className="flex flex-wrap gap-2">
                                <div className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">Diagnóstico General</div>
                                <div className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">Mantenimiento Preventivo</div>
                                <div className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-700">Reparación</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COL: ACTIONS */}
                <div className="space-y-4">
                    <Card className="border-indigo-100 shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <div className="text-center pb-2 border-b border-slate-100">
                                <p className="text-sm text-slate-500">Estado de Conexión</p>
                                {isConnected ? (
                                    <span className="text-green-600 font-bold flex items-center justify-center gap-2 mt-1">
                                        <ShieldCheck className="h-5 w-5" />
                                        Cliente Vinculado
                                    </span>
                                ) : (
                                    <span className="text-slate-400 font-medium">No Vinculado</span>
                                )}
                            </div>

                            {!isConnected ? (
                                <form action={connectToWorkshop}>
                                    <input type="hidden" name="tenantId" value={tenant.id} />
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg">
                                        Conectar Ahora
                                    </Button>
                                    <p className="text-xs text-center text-slate-400 mt-2">
                                        Al conectar, compartes tu perfil básico con este taller para agilizar servicios.
                                    </p>
                                </form>
                            ) : (
                                <Link href="/portal/dashboard">
                                    <Button variant="outline" className="w-full">
                                        Ir a mis Órdenes
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Link href="/portal/marketplace">
                        <Button variant="ghost" className="w-full text-slate-500">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Directorio
                        </Button>
                    </Link>
                </div>
            </div>

            {/* NEW: STORE SECTION */}
            <div className="max-w-5xl mx-auto px-4 mt-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Tienda del Taller</h2>
                        <p className="text-slate-500">Repuestos y productos disponibles para compra directa.</p>
                    </div>
                </div>

                <WorkshopProductControls categories={categories} />

                {products.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed text-slate-400">
                        Este taller no tiene productos publicados en este momento.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <Card key={product.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200 flex flex-col">
                                <div className="aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center">
                                    {(product.images && product.images.length > 0) || product.image_url ? (
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={product.images?.[0] || product.image_url}
                                                alt={product.name}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                    ) : (
                                        <ImageIcon className="h-10 w-10 text-slate-300" />
                                    )}
                                    {product.quantity <= 0 && (
                                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                                            <Badge variant="destructive" className="text-xs px-2 py-0.5">Agotado</Badge>
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-3 flex-1 flex flex-col">
                                    <div className="text-xs text-slate-500 mb-1 capitalize">{product.category || 'General'}</div>
                                    <h3 className="font-bold text-sm text-slate-900 mb-2 line-clamp-2 flex-1">
                                        {product.name}
                                    </h3>
                                    <div className="flex items-end justify-between mt-auto">
                                        <span className="text-lg font-bold text-indigo-600">
                                            ${product.public_price || product.sale_price}
                                        </span>
                                    </div>
                                </CardContent>

                                <CardFooter className="p-3 pt-0">
                                    <AddToCartButton product={product} disabled={product.quantity <= 0} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div >
    )
}
