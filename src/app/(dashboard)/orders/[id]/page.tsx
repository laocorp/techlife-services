import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Smartphone, Calendar, AlertTriangle } from 'lucide-react'
import { getOrderByIdAction } from '@/lib/actions/orders'
import { getOrderEventsAction } from '@/lib/actions/events'
import OrderDetailActions from '@/components/features/orders/OrderDetailActions'
import OrderTimeline from '@/components/features/events/OrderTimeline'
import AddEventForm from '@/components/features/events/AddEventForm'
import OrderItemsManager from '@/components/features/orders/OrderItemsManager'
import OrderPaymentsManager from '@/components/features/finance/OrderPaymentsManager'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: PageProps) {
    const { id } = await params
    const order = await getOrderByIdAction(id)
    const events = await getOrderEventsAction(id)

    if (!order) return notFound()

    // Fetch technicians for assignment dropdown (simple logic: all profiles in tenant for now)
    // Ideally we filter by role='technician'
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: technicians } = await supabase.from('profiles').select('id, full_name, role').eq('tenant_id', order.tenant_id)

    return (
        <div className="space-y-6 container mx-auto py-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/orders" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="h-5 w-5 text-slate-500" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Orden #{order.folio_id}
                        <span className="text-sm font-normal text-muted-foreground px-2 py-1 bg-slate-100 rounded-md">
                            {new Date(order.created_at).toLocaleDateString()}
                        </span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Order Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Problem Description */}
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 text-slate-800">Problema Reportado</h2>
                        <div className="bg-slate-50 p-4 rounded-md text-slate-700 min-h-[100px] whitespace-pre-wrap">
                            {order.description_problem}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                Prioridad: <span className="font-medium text-slate-900 capitalize">{order.priority}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Entrega Est.: <span className="font-medium text-slate-900">{order.estimated_delivery_date ? new Date(order.estimated_delivery_date).toLocaleDateString() : 'Pendiente'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Asset Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card border rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold flex items-center gap-2 mb-3">
                                <User className="h-4 w-4 text-primary" /> Cliente
                            </h3>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-lg">{order.customers?.full_name}</p>
                                <p className="text-muted-foreground">{order.customers?.email}</p>
                                <p className="text-muted-foreground">{order.customers?.phone}</p>
                            </div>
                        </div>

                        <div className="bg-card border rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold flex items-center gap-2 mb-3">
                                <Smartphone className="h-4 w-4 text-primary" /> Equipo
                            </h3>
                            <div className="space-y-1 text-sm">
                                <p className="font-medium text-lg">{order.customer_assets?.identifier}</p>
                                {order.customer_assets?.details && (
                                    <div className="text-muted-foreground flex flex-col gap-1">
                                        <span>
                                            {order.customer_assets.details.make || order.customer_assets.details.brand} {order.customer_assets.details.model}
                                        </span>
                                        {order.customer_assets.details.color && (
                                            <span className="text-xs text-slate-400">Color: {order.customer_assets.details.color}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Workflow */}
                <div className="space-y-6">
                    <OrderDetailActions
                        orderId={order.id}
                        currentStatus={order.status}
                        currentTechnicianId={order.assigned_to}
                        technicians={technicians || []}
                    />

                    {/* Cost & Items Manager */}
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <OrderItemsManager orderId={order.id} />
                    </div>



                    {/* Payment Manager */}
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <OrderPaymentsManager orderId={order.id} />
                    </div>

                    {/* Timeline & Events */}
                    <div className="space-y-6">
                        <div className="bg-card border rounded-lg p-6 shadow-sm">
                            <h3 className="font-semibold mb-4 text-slate-800">Historial y Notas</h3>
                            <OrderTimeline events={events} />
                        </div>

                        <AddEventForm orderId={order.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
