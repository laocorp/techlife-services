'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, AlertCircle, Wrench, QrCode, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { updateOrderStatusAction, assignTechnicianAction } from '@/lib/actions/orders'
import QRCode from 'react-qr-code'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type OrderDetailActionsProps = {
    orderId: string
    currentStatus: string
    currentTechnicianId?: string | null
    technicians?: { id: string, full_name: string }[]
    isOwnerOrAdmin?: boolean
}

const STATUS_FLOW: Record<string, { label: string, next: string[], color: string }> = {
    'reception': { label: 'En Recepción', next: ['diagnosis'], color: 'bg-blue-100 text-blue-800' },
    'diagnosis': { label: 'En Diagnóstico', next: ['approval', 'reception'], color: 'bg-purple-100 text-purple-800' },
    'approval': { label: 'Esperando Aprobación', next: ['repair', 'diagnosis'], color: 'bg-yellow-100 text-yellow-800' },
    'repair': { label: 'En Reparación', next: ['qa', 'approval'], color: 'bg-orange-100 text-orange-800' },
    'qa': { label: 'Control de Calidad', next: ['ready', 'repair'], color: 'bg-teal-100 text-teal-800' },
    'ready': { label: 'Listo para Entrega', next: ['delivered', 'qa'], color: 'bg-green-100 text-green-800' },
    'delivered': { label: 'Entregado', next: [], color: 'bg-gray-100 text-gray-800' }
}

export default function OrderDetailActions({ orderId, currentStatus, currentTechnicianId, technicians = [] }: OrderDetailActionsProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleStatusChange(newStatus: string) {
        setLoading(true)
        try {
            await updateOrderStatusAction(orderId, newStatus)
        } catch (error) {
            console.error('Failed to update status', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAssign(techId: string) {
        setLoading(true)
        try {
            await assignTechnicianAction(orderId, techId)
        } catch (error) {
            console.error('Failed to assign', error)
        } finally {
            setLoading(false)
        }
    }

    // Tracking URL Logic
    const trackingUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/track/${orderId}`
        : `/track/${orderId}`

    const config = STATUS_FLOW[currentStatus] || STATUS_FLOW['reception']
    const nextOptions = config.next

    return (
        <div className="space-y-6">
            {/* Share & Print Actions */}
            <div className="bg-card border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Compartir</h3>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 border-dashed">
                                <QrCode className="mr-2 h-4 w-4" />
                                QR
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Código de Seguimiento</DialogTitle>
                                <DialogDescription>
                                    Comparte este código con el cliente para que pueda consultar el estado de su orden.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center p-6 space-y-4">
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <QRCode value={trackingUrl} size={200} />
                                </div>
                                <p className="text-xs text-slate-500 font-mono break-all text-center">
                                    {trackingUrl}
                                </p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(trackingUrl)
                                        alert('Enlace copiado!')
                                    }}
                                >
                                    Copiar Enlace
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Button
                        variant="outline"
                        className="flex-1 justify-start text-slate-600 hover:text-slate-900 border-dashed"
                        onClick={() => window.open(`/print/orders/${orderId}`, '_blank')}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                </div>

                {/* Warranty Action */}
                {currentStatus === 'delivered' && (
                    <div className="mt-4 pt-4 border-t border-dashed">
                        <Button
                            variant="destructive"
                            className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                            onClick={async () => {
                                if (!confirm('¿Estás seguro de reingresar este equipo por GARANTÍA? Se creará una nueva orden urgente.')) return;
                                setLoading(true)
                                // We need to import this dynamically or move logic to avoid circular deps if any?
                                // Assuming we can import it:
                                const { createWarrantyOrderAction } = await import('@/lib/actions/orders')
                                const res = await createWarrantyOrderAction(orderId)
                                if (res.success && res.orderId) {
                                    router.push(`/orders/${res.orderId}`)
                                } else {
                                    alert('Error al crear garantía')
                                    setLoading(false)
                                }
                            }}
                            disabled={loading}
                        >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Aplicar Garantía (Reingreso)
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-card border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Gestión de Orden</h3>

                {/* Status Actions */}
                <div className="space-y-3">
                    <p className="text-sm font-medium">Estado Actual: <span className={`px-2 py-1 rounded-full text-xs ${config.color}`}>{config.label}</span></p>

                    {nextOptions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {nextOptions.map(nextKey => (
                                <Button
                                    key={nextKey}
                                    size="sm"
                                    variant={nextKey === 'delivered' ? 'default' : nextKey === 'approval' ? 'default' : 'outline'}
                                    className={nextKey === 'approval' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
                                    disabled={loading}
                                    onClick={() => handleStatusChange(nextKey)}
                                >
                                    {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                    {nextKey === 'approval' ? 'Solicitar Aprobación' : `Mover a ${STATUS_FLOW[nextKey]?.label}`}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Esta orden ha finalizado.</p>
                    )}
                </div>
            </div>

            {/* Technician Assignment */}
            <div className="bg-card border rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Asignación</h3>
                <div className="flex items-center gap-4">
                    <Select
                        disabled={loading}
                        onValueChange={handleAssign}
                        defaultValue={currentTechnicianId || undefined}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">-- Sin Asignar --</SelectItem>
                            {technicians.map(tech => (
                                <SelectItem key={tech.id} value={tech.id}>
                                    {tech.full_name || 'Técnico'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {currentTechnicianId && <span className="text-xs text-muted-foreground">Asignado actualmente</span>}
                </div>
            </div>
        </div >
    )
}
