'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Plus, Globe } from 'lucide-react'
import { createWebhookAction, deleteWebhookAction } from '@/lib/actions/webhooks'

interface Webhook {
    id: string
    url: string
    event_type: string
    description: string
    is_active: boolean
}

interface WebhookListProps {
    webhooks: Webhook[]
}

export default function WebhookList({ webhooks: initialWebhooks }: WebhookListProps) {
    const [webhooks, setWebhooks] = useState(initialWebhooks)
    const [isAdding, setIsAdding] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        url: '',
        eventType: 'order.status_change',
        description: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await createWebhookAction(formData)
            // Ideally we'd optimistic update or wait for revalidate, but for now simple reload or just waiting for parent prop update if we used router.refresh() 
            // Since server action revalidates path, we might need to rely on router refresh or window reload for client side lists unless we lift state.
            // For MVP, simply reloading page or assuming parent fetches fresh data on navigate.
            window.location.reload() // Simple brute force refresh to get new list
        } catch (error) {
            alert('Error creating webhook')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar este webhook?')) return
        try {
            await deleteWebhookAction(id)
            window.location.reload()
        } catch (error) {
            alert('Error eliminating webhook')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Webhooks & Automatización</CardTitle>
                    <CardDescription>
                        Conecta TechLife con otras aplicaciones (Zapier, n8n, Slack).
                    </CardDescription>
                </div>
                <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
                    {isAdding ? 'Cancelar' : <><Plus className="h-4 w-4 mr-2" /> Nuevo Webhook</>}
                </Button>
            </CardHeader>
            <CardContent>
                {isAdding && (
                    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Evento</Label>
                                    <Select
                                        value={formData.eventType}
                                        onValueChange={(val) => setFormData({ ...formData, eventType: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar evento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="order.status_change">Cambio de Estado de Orden</SelectItem>
                                            {/* Future: <SelectItem value="order.created">Nueva Orden</SelectItem> */}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Descripción (Opcional)</Label>
                                    <Input
                                        placeholder="Ej. Notificar a Slack"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>URL del Webhook (POST)</Label>
                                <Input
                                    placeholder="https://hooks.zapier.com/..."
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar Webhook'}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}

                <div className="space-y-4">
                    {webhooks.length === 0 ? (
                        <p className="text-center text-slate-500 py-4">No hay webhooks configurados.</p>
                    ) : (
                        webhooks.map((webhook) => (
                            <div key={webhook.id} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                                        <Globe className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-900">{webhook.description || 'Webhook sin nombre'}</h4>
                                        <p className="text-sm text-slate-500 font-mono truncate max-w-md">{webhook.url}</p>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                                {webhook.event_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(webhook.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
