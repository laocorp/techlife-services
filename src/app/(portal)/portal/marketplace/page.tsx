import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Wrench } from 'lucide-react'

export default async function MarketplacePage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const industryFilter = typeof params.industry === 'string' ? params.industry : undefined

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
        .from('tenants')
        .select('*')
        .eq('is_public', true)

    if (industryFilter) {
        query = query.eq('industry', industryFilter)
    }

    const { data: tenants } = await query

    // Helper for Logo URL
    const getLogoUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="text-center space-y-4 py-8">
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Encuentra Tu Taller Ideal</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Explora nuestra red verificada de expertos en automotriz, electrónica y maquinaria.
                </p>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Buscar por nombre..." className="pl-10" />
                </div>
                <div className="flex gap-2">
                    <Link href="/portal/marketplace">
                        <Badge variant={!industryFilter ? "default" : "outline"} className="cursor-pointer">Todos</Badge>
                    </Link>
                    <Link href="/portal/marketplace?industry=automotive">
                        <Badge variant={industryFilter === 'automotive' ? "default" : "outline"} className="cursor-pointer">Automotriz</Badge>
                    </Link>
                    <Link href="/portal/marketplace?industry=electronics">
                        <Badge variant={industryFilter === 'electronics' ? "default" : "outline"} className="cursor-pointer">Electrónica</Badge>
                    </Link>
                </div>
            </div>

            {/* GRID */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tenants && tenants.length > 0 ? (
                    tenants.map((tenant) => (
                        <Card key={tenant.id} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden">
                            <div className="h-32 bg-slate-100 relative">
                                {tenant.logo_url ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={getLogoUrl(tenant.logo_url)!} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-slate-100">
                                        <Wrench className="h-10 w-10 text-indigo-200" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <Badge className="bg-white/90 text-slate-700 hover:bg-white backdrop-blur shadow-sm">
                                        {tenant.industry}
                                    </Badge>
                                </div>
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl">{tenant.name}</CardTitle>
                                {tenant.public_address && (
                                    <CardDescription className="flex items-start gap-1 mt-1">
                                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                        {tenant.public_address}
                                    </CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500 line-clamp-2">
                                    {tenant.description || "Taller especializado con técnicos certificados."}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-0">
                                <Link href={`/portal/workshops/${tenant.id}`} className="w-full">
                                    <Button className="w-full group-hover:bg-indigo-600">Ver Perfil</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <p className="text-slate-500">No hay talleres públicos en esta categoría aún.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
