'use client'

import { useState, useTransition } from 'react'
import { lookupUserByEmailAction, sendConnectionRequestAction, cancelConnectionRequestAction } from '@/lib/actions/connections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, UserPlus, UserX, CheckCircle, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export function CustomerSearch() {
    const [email, setEmail] = useState('')
    const [isPending, startTransition] = useTransition()
    const [result, setResult] = useState<any>(null)
    const { toast } = useToast()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        startTransition(async () => {
            setResult(null)
            const response = await lookupUserByEmailAction(email)
            if (response.error) {
                toast({ title: 'Error', description: response.error, variant: 'destructive' })
            } else if (response.user) {
                setResult(response.user)
            } else {
                toast({ title: 'Sin resultados', description: 'No se encontró ningún usuario con ese email.' })
            }
        })
    }

    const handleConnect = async () => {
        if (!result) return
        startTransition(async () => {
            const response = await sendConnectionRequestAction(result.id)
            if (response.error) {
                toast({ title: 'Error', description: response.error, variant: 'destructive' })
            } else {
                toast({ title: 'Solicitud enviada', description: `Se ha enviado una solicitud a ${result.full_name}` })
                setResult((prev: any) => ({ ...prev, connectionStatus: 'pending' }))
            }
        })
    }

    const handleCancel = async () => {
        if (!result) return
        startTransition(async () => {
            const response = await cancelConnectionRequestAction(result.id)
            if (response.error) {
                toast({ title: 'Error', description: response.error, variant: 'destructive' })
            } else {
                toast({ title: 'Solicitud cancelada', description: 'La solicitud ha sido eliminada.' })
                setResult((prev: any) => ({ ...prev, connectionStatus: null }))
            }
        })
    }

    // URL Helper
    const getAvatarUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/branding/${path}`
    }

    return (
        <div className="w-full max-w-md mx-auto mb-8">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <Input
                    type="email"
                    placeholder="Buscar cliente por email (ej: cliente@gmail.com)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
                <Button type="submit" disabled={isPending || !email}>
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                </Button>
            </form>

            {result && (
                <Card className="animate-in fade-in zoom-in-95 duration-200 dark:bg-slate-900">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={getAvatarUrl(result.avatar_url) || undefined} />
                                <AvatarFallback>{result.full_name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-medium text-slate-900 dark:text-slate-100">{result.full_name}</h3>
                                <p className="text-xs text-slate-500">{email}</p>
                            </div>
                        </div>

                        <div>
                            {result.connectionStatus === 'accepted' ? (
                                <div className="flex items-center text-green-600 dark:text-green-500 text-sm font-medium">
                                    <CheckCircle className="h-4 w-4 mr-1" /> Conectado
                                </div>
                            ) : result.connectionStatus === 'pending' ? (
                                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isPending} className="text-amber-600 border-amber-200 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                                    <Clock className="h-4 w-4 mr-1" /> Pendiente (Cancelar)
                                </Button>
                            ) : (
                                <Button size="sm" onClick={handleConnect} disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700">
                                    <UserPlus className="h-4 w-4 mr-1" /> Conectar
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
