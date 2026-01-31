'use client'

import { useState } from 'react'
import { Webhook, createWebhookAction, deleteWebhookAction, toggleWebhookAction } from '@/lib/actions/webhooks'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2, Link as LinkIcon, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"

export default function WebhookList({ webhooks }: { webhooks: Webhook[] }) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        name: '',
        url: '',
        event_type: 'order.completed',
        secret: ''
    })

    const handleCreate = async () => {
        if (!formData.name || !formData.url) {
            toast({ title: 'Campos requeridos', description: 'Nombre y URL son obligatorios.', variant: 'destructive' })
            return
        }

        setLoading(true)
        try {
            await createWebhookAction(formData)
            setIsCreateOpen(false)
            setFormData({ name: '', url: '', event_type: 'order.completed', secret: '' }) // Reset
            toast({ title: 'Webhook creado' })
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro de eliminar este webhook?')) return
        await deleteWebhookAction(id)
        toast({ title: 'Webhook eliminado' })
    }

    const handleToggle = async (id: string, active: boolean) => {
        await toggleWebhookAction(id, active)
        toast({ title: active ? 'Desactivado' : 'Activado' })
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Automatizaciones (Webhooks)</CardTitle>
                    <CardDescription>
                        Envía notificaciones a sistemas externos cuando ocurren eventos.
                    </CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Nuevo Webhook
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Configurar Nuevo Webhook</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Nombre</Label>
                                <Input
                                    placeholder="Ej. Notificación WhatsApp"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL del Endpoint</Label>
                                <Input
                                    placeholder="https://api.tu-servicio.com/webhook"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Evento Trigger</Label>
                                <Select
                                    value={formData.event_type}
                                    onValueChange={val => setFormData({ ...formData, event_type: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="order.completed">Orden Completada</SelectItem>
                                        <SelectItem value="payment.received">Pago Recibido</SelectItem>
                                        <SelectItem value="inventory.low">Stock Bajo (Próximamente)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Secreto (Opcional)</Label>
                                <Input
                                    type="password"
                                    placeholder="Clave de firma"
                                    value={formData.secret}
                                    onChange={e => setFormData({ ...formData, secret: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {webhooks.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 border border-dashed rounded-lg">
                            No hay webhooks configurados
                        </div>
                    ) : (
                        webhooks.map(wh => (
                            <div key={wh.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white border rounded">
                                        <LinkIcon className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{wh.name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-mono">
                                                {wh.event_type}
                                            </span>
                                            <span className="truncate max-w-[200px]">{wh.url}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs">Activo</Label>
                                        <Switch
                                            checked={wh.is_active}
                                            onCheckedChange={() => handleToggle(wh.id, wh.is_active)}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-slate-400 hover:text-red-500"
                                        onClick={() => handleDelete(wh.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
