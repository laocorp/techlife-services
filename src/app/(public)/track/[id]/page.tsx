import { getPublicOrderAction } from '@/lib/actions/tracking'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, CheckCircle, Clock, Package, Smartphone, User, Hammer } from 'lucide-react'

// Simple mapping of status to readable text and progress
const STATUS_STEPS = [
    { id: 'reception', label: 'Recepción' },
    { id: 'diagnosis', label: 'Diagnóstico' },
    { id: 'approval', label: 'Aprobación' },
    { id: 'repair', label: 'Reparación' },
    { id: 'qa', label: 'Calidad' },
    { id: 'ready', label: 'Listo' },
    { id: 'delivered', label: 'Entregado' },
]

export default async function PublicTrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getPublicOrderAction(id)

    if (!order) return notFound()

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status)

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                            TL
                        </div>
                        <span className="font-bold text-xl text-slate-900">TechLife Service</span>
                    </div>
                    <div className="text-sm text-slate-500">
                        Seguimiento
                    </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
                {/* Order Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="bg-slate-900 p-6 text-white">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-2xl font-bold">Orden #{order.folio}</h1>
                                <p className="text-slate-300 mt-1 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Actualizado: {format(new Date(order.updated_at), "d MMM, HH:mm", { locale: es })}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                    ${order.status === 'delivered' ? 'bg-green-500 text-white' : 'bg-indigo-500 text-white'}
                                `}>
                                    {STATUS_STEPS.find(s => s.id === order.status)?.label || order.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Smartphone className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Equipo</p>
                                <p className="font-semibold text-slate-900">{order.device}</p>
                                <p className="text-sm text-slate-600">
                                    {order.device_details?.brand} {order.device_details?.model}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-slate-100 rounded-lg">
                                <Calendar className="h-6 w-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Fecha Estimada</p>
                                <p className="font-semibold text-slate-900">
                                    {order.estimated_date
                                        ? format(new Date(order.estimated_date), "d MMMM yyyy", { locale: es })
                                        : 'Pendiente'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 overflow-x-auto">
                    <h3 className="font-semibold text-slate-900 mb-6">Progreso de Reparación</h3>
                    <div className="flex items-center min-w-[600px]">
                        {STATUS_STEPS.map((step, index) => {
                            const isCompleted = index <= currentStepIndex
                            const isCurrent = index === currentStepIndex

                            return (
                                <div key={step.id} className="flex-1 relative last:flex-none">
                                    <div className="flex flex-col items-center relative z-10">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                                            ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 text-slate-300'}
                                        `}>
                                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <span className="text-xs">{index + 1}</span>}
                                        </div>
                                        <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {/* Connector Line */}
                                    {index < STATUS_STEPS.length - 1 && (
                                        <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0
                                            ${index < currentStepIndex ? 'bg-indigo-600' : 'bg-slate-200'}
                                        `} />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Public Timeline */}
                <div className="space-y-6">
                    <h3 className="font-semibold text-slate-900 px-1">Actividad Reciente</h3>
                    {order.timeline.map((event: any, i: number) => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex gap-4">
                            <div className="mt-1">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50"></div>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">
                                    {format(new Date(event.created_at), "d MMM, HH:mm", { locale: es })}
                                </p>
                                <p className="text-slate-900">
                                    {event.content}
                                </p>
                            </div>
                        </div>
                    ))}
                    {order.timeline.length === 0 && (
                        <div className="text-center py-8 text-slate-500 bg-white rounded-lg border border-dashed">
                            No hay actividad pública registrada aún.
                        </div>
                    )}
                </div>
            </main>

            <footer className="py-6 text-center text-sm text-slate-400">
                <p>© {new Date().getFullYear()} {order.tenant} - Powered by TechLife</p>
            </footer>
        </div>
    )
}
