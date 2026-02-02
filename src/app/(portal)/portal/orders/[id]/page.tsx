import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle, Clock, FileText, AlertCircle, Wrench, Camera, MessageSquare } from 'lucide-react'
import { approveOrderAction } from '../../actions'
import { PrintButton } from '@/components/common/PrintButton'

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch basic order info for metadata
    const { data: order } = await supabase
        .from('service_orders')
        .select(`
            folio_id,
            status,
            customer_assets (identifier, details),
            tenants (name)
        `)
        .eq('id', id)
        .single()

    if (!order) {
        return {
            title: 'Orden No Encontrada',
        }
    }

    const asset = Array.isArray(order.customer_assets) ? order.customer_assets[0] : order.customer_assets
    const tenant = Array.isArray(order.tenants) ? order.tenants[0] : order.tenants

    const deviceName = `${asset?.details?.make || 'Dispositivo'} ${asset?.details?.model || ''}`.trim()
    const tenantName = tenant?.name || 'TechLife Service'

    // Status translation for the title
    const getStatusText = (s: string) => {
        const map: Record<string, string> = {
            'reception': 'En Recepción',
            'diagnosis': 'En Diagnóstico',
            'approval': 'Esperando Aprobación',
            'repair': 'En Reparación',
            'ready': 'Listo para Retiro',
            'delivered': 'Entregado'
        }
        return map[s] || 'En Proceso'
    }

    return {
        title: `Orden #${order.folio_id} (${getStatusText(order.status)}) - ${tenantName}`,
        description: `Hola, el estado de tu ${deviceName} es: ${getStatusText(order.status)}. Haz clic para ver el informe completo, fotos y presupuesto.`,
        openGraph: {
            title: `🛠️ Orden #${order.folio_id}: ${deviceName}`,
            description: `Estado: ${getStatusText(order.status)} | Taller: ${tenantName}`,
            // details about images would go here if we had dynamic OG generation
        }
    }
}


export default async function PortalOrderDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect('/login')

    // 1. Fetch Order Details
    const { data: order } = await supabase
        .from('service_orders')
        .select(`
            *,
            tenants (name, contact_email, contact_phone, logo_url, address, city),
            customer_assets (identifier, details)
        `)
        .eq('id', id)
        .single()

    if (!order) return notFound()

    // Helper for Logo URL
    const getLogoUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
    }
    const tenantLogo = getLogoUrl(order.tenants?.logo_url)

    // 2. Fetch Order Items (Quote)
    const { data: items } = await supabase
        .from('service_order_items')
        .select(`
            *,
            products (name)
        `)
        .eq('service_order_id', id)

    // 3. Fetch Events (Evidence & History)
    const { data: events } = await supabase
        .from('service_order_events')
        .select('*')
        .eq('service_order_id', id)
        .order('created_at', { ascending: true })

    const evidenceList = events?.filter(e => e.type === 'evidence') || []
    const timelineList = events?.filter(e => e.type === 'comment' || e.type === 'status_change') || []

    const total = items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0

    // 4. Get Public URL for Evidence
    const evidenceWithUrls = await Promise.all(evidenceList.map(async (e) => {
        if (!e.metadata?.filePath) return null
        const { data } = await supabase.storage.from('order-evidence').createSignedUrl(e.metadata.filePath, 3600 * 24)
        return { ...e, url: data?.signedUrl }
    }))
    const validEvidence = evidenceWithUrls.filter(e => e !== null)

    // 5. Status Helpers
    const isApprovalNeeded = order.status === 'approval'
    const isApproved = ['repair', 'qa', 'ready', 'delivered'].includes(order.status)

    // Status Badge Color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approval': return 'bg-yellow-100 text-yellow-700'
            case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
            case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20'
            case 'delivered': return 'bg-muted text-muted-foreground border-border'
            case 'cancelled': return 'bg-destructive/10 text-destructive border-destructive/20'
            default: return 'bg-muted text-muted-foreground'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'reception': return 'Recepción'
            case 'diagnosis': return 'En Diagnóstico'
            case 'approval': return 'Esperando Aprobación'
            case 'repair': return 'En Reparación'
            case 'qa': return 'Control de Calidad'
            case 'ready': return 'Listo para Retiro'
            case 'delivered': return 'Entregado'
            default: return status
        }
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            {/* Header - Web Only */}
            <div className="space-y-4 print:hidden">
                <Link href="/portal/garage">
                    <Button variant="ghost" size="sm" className="-ml-4 text-muted-foreground">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver a Mi Garaje
                    </Button>
                </Link>

                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            Informe Técnico
                            <Badge variant="secondary" className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1">Orden #{order.folio_id} • {order.tenants?.name}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <PrintButton />
                        <div>
                            <div className="text-sm text-muted-foreground">Fecha de Ingreso</div>
                            <div className="font-medium">{new Date(order.created_at).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        {tenantLogo ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={tenantLogo} alt="Logo" className="w-16 h-16 object-contain" />
                        ) : (
                            <div className="bg-foreground text-background p-3 rounded-lg">
                                <Wrench className="h-8 w-8" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-foreground">{order.tenants?.name}</h2>
                            <div className="text-sm text-muted-foreground space-y-0.5">
                                {order.tenants?.address && <p>{order.tenants.address} {order.tenants?.city ? `, ${order.tenants.city}` : ''}</p>}
                                {order.tenants?.contact_email && <p>{order.tenants.contact_email}</p>}
                                {order.tenants?.contact_phone && <p>{order.tenants.contact_phone}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-xl font-bold text-foreground">Informe Técnico</h1>
                        <p className="text-muted-foreground">Orden #{order.folio_id}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Asset Info */}
            <Card className="bg-card border-dashed">
                <CardContent className="flex items-center gap-4 p-4">
                    <div className="bg-background p-2 rounded border shadow-sm">
                        <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <div className="font-semibold text-foreground">{order.customer_assets?.details?.make} {order.customer_assets?.details?.model}</div>
                        <div className="text-sm text-muted-foreground font-mono">{order.customer_assets?.identifier}</div>
                    </div>
                </CardContent>
            </Card>

            {/* Diagnosis Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-primary" />
                        Diagnóstico y Problema
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Problema Reportado</h3>
                        <p className="text-foreground bg-muted p-3 rounded-lg">{order.description_problem}</p>
                    </div>

                    {order.diagnosis_report && (
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Informe del Técnico</h3>
                            <p className="text-foreground bg-muted p-3 rounded-lg border border-border">
                                {order.diagnosis_report}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Evidence Gallery */}
            {
                validEvidence.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Camera className="h-5 w-5 text-primary" />
                                Evidencia Fotográfica
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {validEvidence.map((ev: any) => (
                                    <div key={ev.id} className="relative aspect-square rounded-lg overflow-hidden border bg-muted group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={ev.url}
                                            alt="Evidencia"
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Timeline / Notes */}
            {
                timelineList.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-muted-foreground text-base">
                                <MessageSquare className="h-5 w-5" />
                                Bitácora del Servicio
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                {timelineList.map((event) => (
                                    <div key={event.id} className="flex gap-3 text-sm">
                                        <div className="mt-0.5">
                                            <div className="h-2 w-2 rounded-full bg-border ring-2 ring-background"></div>
                                        </div>
                                        <div className="flex-1 bg-muted p-3 rounded-lg">
                                            <p className="text-foreground">{event.content}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(event.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            }

            {/* Default Quote / Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        Presupuesto / Repuestos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {items && items.length > 0 ? (
                        <div className="space-y-4">
                            <div className="rounded-lg border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            <th className="p-3">Concepto</th>
                                            <th className="p-3 text-right">Cant.</th>
                                            <th className="p-3 text-right">Precio U.</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="p-3">{item.products?.name || 'Item'}</td>
                                                <td className="p-3 text-right">{item.quantity}</td>
                                                <td className="p-3 text-right">${item.unit_price}</td>
                                                <td className="p-3 text-right font-medium">${(item.quantity * item.unit_price).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-bold">
                                        <tr>
                                            <td colSpan={3} className="p-3 text-right">Total Estimado</td>
                                            <td className="p-3 text-right text-indigo-600">${total.toFixed(2)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500">* Los precios pueden variar si se encuentran daños ocultos adicionales.</p>
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-500 italic">
                            Aún no se han cargado costos o repuestos.
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions Footer */}
            {
                isApprovalNeeded && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center space-y-4 shadow-sm no-print">
                        <div className="mx-auto bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center text-yellow-600 mb-2">
                            <Clock className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold text-yellow-800">Se requiere tu aprobación</h3>
                        <p className="text-yellow-700 max-w-md mx-auto">
                            Por favor revisa el diagnóstico y el presupuesto arriba detallado. Si estás de acuerdo, aprueba la reparación para comenzar.
                        </p>

                        <form action={approveOrderAction} className="flex justify-center gap-4 pt-2">
                            <input type="hidden" name="orderId" value={order.id} />
                            <Button type="submit" size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all">
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Aprobar Reparación
                            </Button>
                        </form>
                    </div>
                )
            }

            {
                isApproved && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-green-800">Reparación Aprobada</h3>
                            <p className="text-green-700">
                                Gracias. El equipo técnico está trabajando en tu equipo. Te notificaremos cuando esté listo.
                            </p>
                        </div>
                    </div>
                )
            }

            {
                order.status === 'reception' && (
                    <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed">
                        <p className="text-slate-500">Tu equipo está en cola de <strong>revisión inicial</strong>. Pronto recibirás el diagnóstico.</p>
                    </div>
                )
            }
            {
                order.status === 'diagnosis' && (
                    <div className="text-center p-8 bg-blue-50 rounded-xl border border-dashed border-blue-200">
                        <p className="text-blue-600 font-medium">Tu equipo está siendo diagnosticado en este momento.</p>
                    </div>
                )
            }

            {/* Print Only Footer */}
            <div className="hidden print:block text-center text-sm text-slate-400 mt-8 pt-8 border-t">
                <p>Generado automáticamente por <strong>TechLife Service</strong></p>
            </div>

        </div>
    )
}
