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
            <div className="flex items-center justify-between px-2">
                <div>
                    <h2 className="text-xl font-extrabold tracking-tight text-slate-800">Panel de Despacho</h2>
                    <p className="text-sm text-slate-500">Estado global de tu sede hoy.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COLUMN 1: UNASSIGNED */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                        <h3 className="font-bold text-orange-950 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            Por Asignar
                        </h3>
                        <Badge variant="secondary" className="bg-orange-200/50 text-orange-800">{unassigned.length}</Badge>
                    </div>

                    <div className="space-y-4">
                        {unassigned.length === 0 && (
                            <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-orange-100 text-slate-400">
                                No hay órdenes pendientes. 🎉
                            </div>
                        )}
                        {unassigned.map(order => (
                            <Card key={order.id} className="rounded-3xl border-none shadow-xl shadow-slate-200/50 hover:scale-[1.02] transition-transform overflow-hidden group">
                                <div className="h-2 w-full bg-orange-500" />
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-black text-xl text-slate-900 flex items-center gap-2">
                                                #{order.folio_id || order.id.slice(0, 6)}
                                                {order.priority === 'urgent' && <Badge variant="destructive" className="rounded-full bg-red-100 text-red-600 border-none px-3 font-bold">URGENTE</Badge>}
                                            </div>
                                            <div className="text-lg font-bold text-slate-700 mt-1">{order.asset?.model || 'Equipo General'}</div>
                                            <p className="text-sm text-slate-500 mt-2 line-clamp-2 bg-slate-50 p-3 rounded-2xl italic">"{order.description_problem}"</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 capitalize">
                                            <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <User className="w-4 h-4" />
                                            </div>
                                            {order.customers?.full_name?.split(' ')[0] || 'Cliente'}
                                        </div>
                                        <Button size="lg" onClick={() => openAssign(order)} className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 px-6 font-bold">
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
                    <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <h3 className="font-bold text-blue-950 flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-blue-600" />
                            En Progreso
                        </h3>
                        <Badge variant="secondary" className="bg-blue-200/50 text-blue-800">{assigned.length}</Badge>
                    </div>

                    <div className="space-y-4">
                        {assigned.length === 0 && (
                            <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-blue-100 text-slate-400">
                                No hay órdenes en marcha.
                            </div>
                        )}
                        {assigned.map(order => (
                            <Link href={`/orders/${order.id}`} key={order.id} className="block group">
                                <Card className="rounded-3xl border-none shadow-xl shadow-blue-200/50 hover:scale-[1.02] transition-transform overflow-hidden relative">
                                    <div className="h-1.5 w-full bg-blue-500" />
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-black text-xl text-slate-900">#{order.folio_id || order.id.slice(0, 6)}</div>
                                                <div className="text-lg font-bold text-slate-700 mt-1">{order.asset?.model}</div>
                                            </div>
                                            <Badge variant="outline" className="rounded-full bg-blue-600 text-white border-none py-1 px-3 font-bold uppercase text-[10px] tracking-widest">{order.status}</Badge>
                                        </div>

                                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-2 ring-blue-50">
                                                    <AvatarImage src={order.tech?.avatar_url} />
                                                    <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-bold">
                                                        {order.tech?.full_name?.substring(0, 2).toUpperCase() || 'TE'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Encargado</span>
                                                    <span className="text-sm font-bold text-slate-800">{order.tech?.full_name?.split(' ')[0] || 'Técnico'}</span>
                                                </div>
                                            </div>
                                            <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </div>
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
