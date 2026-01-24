import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Car, Calendar, ClipboardList, Wrench, FileText } from 'lucide-react'

export default async function GarageAssetPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    // 1. Try fetching from Personal Assets
    let { data: asset } = await supabase
        .from('user_assets')
        .select('*')
        .eq('id', id)
        .single()

    let isPersonal = true
    let tenantName = null

    // 2. If not found, try fetching from Workshop Assets
    if (!asset) {
        const { data: workshopAsset } = await supabase
            .from('customer_assets')
            .select(`
                *,
                customers!inner (
                    user_id,
                    tenants (name)
                )
            `)
            .eq('id', id)
            .eq('customers.user_id', user.id)
            .single()

        if (workshopAsset) {
            asset = {
                id: workshopAsset.id,
                identifier: workshopAsset.identifier,
                details: workshopAsset.details,
                created_at: workshopAsset.created_at,
            }
            isPersonal = false
            tenantName = workshopAsset.customers?.tenants?.name
        } else {
            return notFound()
        }
    }

    // 3. Fetch Service History
    // A. Personal Logs
    const { data: personalLogs } = await supabase
        .from('personal_maintenance_logs')
        .select('*')
        .eq('user_asset_id', id)
        .order('service_date', { ascending: false })

    // B. Official Orders (for Workshop Assets)
    let officialOrders: any[] = []
    if (!isPersonal) {
        const { data: orders } = await supabase
            .from('service_orders')
            .select(`
                id,
                folio_id,
                created_at,
                description_problem,
                status,
                estimated_delivery_date,
                tenants (name)
            `)
            .eq('asset_id', id)
            .order('created_at', { ascending: false })

        officialOrders = orders || []
    }

    // Merge and Sort
    const history = [
        ...(personalLogs?.map(l => ({
            id: l.id,
            type: 'manual',
            title: l.description,
            date: l.service_date,
            provider: l.provider_name,
            notes: l.notes,
            cost: l.cost
        })) || []),
        ...(officialOrders.map(o => ({
            id: o.id,
            type: 'official',
            title: `Orden #${o.folio_id}: ${o.description_problem}`,
            date: o.created_at,
            provider: o.tenants?.name || 'Taller',
            notes: `Estado: ${o.status.toUpperCase()}`,
            cost: null // Usually cost internal
        })) || [])
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/portal/garage">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {asset.alias || asset.identifier}
                        {!isPersonal && <Badge variant="secondary" className="bg-orange-100 text-orange-700">{tenantName}</Badge>}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {asset.details?.make || asset.details?.brand} {asset.details?.model} {asset.details?.year}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* DETAILS SIDEBAR */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Ficha Técnica</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Identificador</span>
                                <span className="font-mono font-medium">{asset.identifier}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Marca</span>
                                <span className="font-medium capitalize">{asset.details?.make || asset.details?.brand || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Modelo</span>
                                <span className="font-medium capitalize">{asset.details?.model || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Año</span>
                                <span className="font-medium">{asset.details?.year || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Color</span>
                                <span className="font-medium capitalize">{asset.details?.color || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* TIMELINE / LOGS */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Bitácora de Mantenimiento</h2>
                        {isPersonal && (
                            <Button variant="outline" size="sm">
                                <FileText className="h-4 w-4 mr-2" />
                                Registrar Evento
                            </Button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {history.length > 0 ? (
                            history.map((event) => (
                                <Card key={event.id}>
                                    <CardContent className="p-4 flex gap-4">
                                        <div className={`p-2 rounded-lg h-fit ${event.type === 'manual' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {event.type === 'manual' ? <Wrench className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{event.title}</h3>
                                                    <span className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString()}</span>
                                                </div>
                                                {event.type === 'official' && (
                                                    <Link href={`/portal/orders/${event.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8">
                                                            Ver Informe
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600">Por: <span className="font-medium">{event.provider}</span></p>
                                            {event.notes && <p className="text-sm text-slate-500 mt-2 bg-slate-50 p-2 rounded">{event.notes}</p>}
                                            {event.cost && <div className="mt-2 text-right font-mono font-bold text-slate-700">${event.cost}</div>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50 text-slate-500">
                                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>No hay registros de mantenimiento aún.</p>
                                {!isPersonal && <p className="text-xs mt-2 text-slate-400">Las reparaciones del taller aparecerán aquí automáticamente.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
