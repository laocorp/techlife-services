'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Store, Check, X, Loader2 } from 'lucide-react'
import { useTransition } from 'react'
import { respondToInvitationAction } from '@/lib/actions/connections'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Invitation {
    id: number
    created_at: string
    tenant: {
        id: string
        name: string
        industry: string
        logo_url: string | null
    }
}

export default function PendingInvitations({ invitations }: { invitations: Invitation[] }) {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    if (!invitations || invitations.length === 0) return null

    const handleResponse = (id: number, status: 'accepted' | 'rejected') => {
        startTransition(async () => {
            const result = await respondToInvitationAction(id, status)
            if (result.success) {
                toast.success(status === 'accepted' ? '¡Conectado exitosamente!' : 'Invitación rechazada')
                router.refresh()
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <section className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{invitations.length}</span>
                Solicitudes de Taller
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {invitations.map((inv) => (
                    <Card key={inv.id} className="border-indigo-100 bg-indigo-50/50">
                        <CardContent className="p-4 flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                                    <Store className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{inv.tenant.name}</h4>
                                    <p className="text-xs text-slate-500">Te ha invitado a conectar.</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(inv.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-auto">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                    disabled={isPending}
                                    onClick={() => handleResponse(inv.id, 'accepted')}
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    Aceptar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 border-slate-200 hover:bg-white text-slate-600"
                                    disabled={isPending}
                                    onClick={() => handleResponse(inv.id, 'rejected')}
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Ignorar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
}
