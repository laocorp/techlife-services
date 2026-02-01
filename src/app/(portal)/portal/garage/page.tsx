import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, Plus, Wrench, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'

import CustomerProfileCard from '@/components/portal/CustomerProfileCard'

export default async function MyGaragePage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    // Fetch Avatar (from first found customer record)
    const { data: customer } = await supabase
        .from('customers')
        .select('avatar_url')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    // 1. Fetch Personal Assets
    const { data: personalAssets } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // 2. Fetch Workshop Assets (via linked customers)
    const { data: workshopAssets } = await supabase
        .from('customer_assets')
        .select(`
            id,
            identifier,
            details,
            created_at,
            customers!inner (
                user_id,
                tenants (name)
            )
        `)
        .eq('customers.user_id', user.id)

    // 3. Normalize and Merge
    const normalizedPersonal = personalAssets?.map(a => ({
        ...a,
        source: 'Personal',
        tenantName: null
    })) || []

    const personalIdentifiers = new Set(normalizedPersonal.map(a => a.identifier))

    const normalizedWorkshop = workshopAssets?.map((a: any) => ({
        id: a.id,
        identifier: a.identifier,
        details: a.details,
        created_at: a.created_at,
        source: 'Taller',
        tenantName: a.customers?.tenants?.name,
        alias: null
    })).filter((a: any) => !personalIdentifiers.has(a.identifier)) || []

    const allAssets = [...normalizedPersonal, ...normalizedWorkshop].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    async function deleteAsset(formData: FormData) {
        'use server'
        const id = formData.get('id') as string
        const source = formData.get('source') as string

        if (source === 'Taller') {
            // Cannot delete workshop assets from here
            return
        }

        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)
        await supabase.from('user_assets').delete().eq('id', id)
        revalidatePath('/portal/garage')
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Mi Garaje</h1>
                    <p className="text-slate-500">Gestiona tus vehículos y equipos personales.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <CustomerProfileCard user={user} avatarUrl={customer?.avatar_url} />

                    <Link href="/portal/garage/new">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 h-24 w-24 rounded-xl flex-col gap-2 shadow-sm hover:shadow-md transition-all">
                            <Plus className="h-6 w-6" />
                            <span>Nuevo</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allAssets.length > 0 ? (
                    allAssets.map((asset) => (
                        <Card key={asset.id} className="group relative hover:shadow-md transition bg-white overflow-hidden">
                            {asset.source === 'Taller' && (
                                <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-bl-lg font-medium">
                                    {asset.tenantName}
                                </div>
                            )}
                            <CardHeader className="flex flex-row gap-4 items-start pb-2">
                                <div className={`p-3 rounded-lg ${asset.source === 'Taller' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    <Car className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle>{asset.alias || asset.identifier}</CardTitle>
                                    <CardDescription className="uppercase font-mono text-xs tracking-wider">
                                        {asset.identifier}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-slate-600 space-y-1">
                                <div className="flex justify-between">
                                    <span>Marca:</span>
                                    <span className="font-medium">{asset.details?.make || asset.details?.brand || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Modelo:</span>
                                    <span className="font-medium">{asset.details?.model || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Año:</span>
                                    <span className="font-medium">{asset.details?.year || '-'}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 flex gap-2 border-t bg-slate-50/50">
                                <Link href={`/portal/garage/${asset.id}`} className="flex-1">
                                    <Button variant="outline" size="sm" className="w-full">
                                        <Wrench className="h-3 w-3 mr-2" />
                                        Bitácora
                                    </Button>
                                </Link>

                                {asset.source === 'Personal' && (
                                    <form action={deleteAsset}>
                                        <input type="hidden" name="id" value={asset.id} />
                                        <input type="hidden" name="source" value={asset.source} />
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500 hover:bg-red-50 px-2">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                )}
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-xl bg-slate-50">
                        <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                            <Car className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900">Tu garaje está vacío</h3>
                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                            Registra tus autos o dispositivos para llevar un control de sus mantenimientos.
                        </p>
                        <Link href="/portal/garage/new">
                            <Button variant="outline">Comenzar Registro</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
