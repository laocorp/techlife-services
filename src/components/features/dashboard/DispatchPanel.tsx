'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserProfile } from '@/types'
import { assignTechnicianAction } from '@/lib/actions/orders'
import { toast } from '@/components/ui/use-toast'
import { Clock, Wrench, ArrowRight, User, AlertCircle, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Link from 'next/link'

interface DispatchPanelProps {
    unassigned: any[]
    assigned: any[]
    technicians: UserProfile[]
}

export default function DispatchPanel({ unassigned, assigned, technicians }: DispatchPanelProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [isAssignOpen, setIsAssignOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleAssign(formData: FormData) {
        if (!selectedOrder) return
        setLoading(true)
        const techId = formData.get('technician_id') as string

        const res = await assignTechnicianAction(selectedOrder.id, techId)
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Orden Asignada', description: `Orden #${selectedOrder.folio_id || selectedOrder.id.slice(0, 6)} asignada correctamente.` })
            setIsAssignOpen(false)
            setSelectedOrder(null)
        }
    }

    const openAssign = (order: any) => {
        setSelectedOrder(order)
        setIsAssignOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Panel de Despacho</h2>
                    <p className="text-muted-foreground">Gestiona y asigna las órdenes de servicio de tu sede.</p>
                </div>
                {/* Could add filter/search here */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* COLUMN 1: UNASSIGNED */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
                        <h3 className="font-semibold flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Por Asignar
                        </h3>
                        <Badge variant="secondary">{unassigned.length}</Badge>
                    </div>

                    <div className="space-y-3">
                        {unassigned.length === 0 && (
                            <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                                No hay órdenes pendientes de asignación.
                            </div>
                        )}
                        {unassigned.map(order => (
                            <Card key={order.id} className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                #{order.folio_id || order.id.slice(0, 6)}
                                                {order.priority === 'urgent' && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
                                            </div>
                                            <div className="text-sm font-medium">{order.asset?.model || 'Dispositivo Desconocido'}</div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{order.description_problem}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="w-3 h-3" />
                                            {order.customers?.full_name || 'Cliente'}
                                        </div>
                                        <Button size="sm" onClick={() => openAssign(order)} className="bg-orange-600 hover:bg-orange-700 text-white">
                                            Asignar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* COLUMN 2: IN PROGRESS / ASSIGNED */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-card p-3 rounded-lg border">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-blue-500" />
                            En Progreso
                        </h3>
                        <Badge variant="secondary">{assigned.length}</Badge>
                    </div>

                    <div className="space-y-3">
                        {assigned.length === 0 && (
                            <div className="text-center p-8 border rounded-lg border-dashed text-muted-foreground">
                                No hay órdenes en progreso actualmente.
                            </div>
                        )}
                        {assigned.map(order => (
                            <Link href={`/orders/${order.id}`} key={order.id} className="block">
                                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 group">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold">#{order.folio_id || order.id.slice(0, 6)}</div>
                                                <div className="text-sm font-medium">{order.asset?.model}</div>
                                            </div>
                                            <Badge variant="outline" className="capitalize">{order.status}</Badge>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6">
                                                    <AvatarImage src={order.tech?.avatar_url} />
                                                    <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                                        {order.tech?.full_name?.substring(0, 2).toUpperCase() || 'TE'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs font-medium">{order.tech?.full_name?.split(' ')[0] || 'Técnico'}</span>
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ASSIGN DIALOG */}
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Asignar Técnico</DialogTitle>
                        <DialogDescription>
                            Selecciona el técnico responsable para la orden <strong>#{selectedOrder?.folio_id || selectedOrder?.id.slice(0, 6)}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={handleAssign} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Técnico</label>
                            <Select name="technician_id" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {technicians.map(tech => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${tech.role === 'head_technician' ? 'bg-purple-500' : 'bg-green-500'}`} />
                                                {tech.full_name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading}>Confirmar Asignación</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
