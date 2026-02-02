'use client'

import { useState } from 'react'
import { Search, UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { lookupUserAction, sendConnectionRequestAction } from '@/lib/actions/connections'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function CustomerSearch() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchResult, setSearchResult] = useState<any>(null)
    const [requestStatus, setRequestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setLoading(true)
        setSearchResult(null)
        setRequestStatus('idle')

        try {
            const user = await lookupUserAction(email)
            if (user) {
                setSearchResult(user)
            } else {
                toast.info('Usuario no encontrado en la plataforma global.')
            }
        } catch (err) {
            toast.error('Error al buscar usuario')
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async () => {
        if (!searchResult) return

        setRequestStatus('sending')
        try {
            const res = await sendConnectionRequestAction(searchResult.id)
            if (res?.error) {
                toast.error(res.error)
                setRequestStatus('error')
            } else {
                toast.success('Solicitud enviada correctamente')
                setRequestStatus('sent')
                setEmail('')
            }
        } catch (error) {
            toast.error('Error al enviar solicitud')
            setRequestStatus('error')
        }
    }

    return (
        <Card className="mb-8 border-dashed bg-muted/30">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1 space-y-4 w-full">
                        <div>
                            <h3 className="font-medium text-foreground flex items-center gap-2">
                                <Search className="h-4 w-4 text-indigo-500" />
                                Buscar Usuario Global
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Busca por email para conectar con usuarios que ya usan TechLife.
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="ejemplo@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background"
                            />
                            <Button type="submit" disabled={loading || !email}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
                            </Button>
                        </form>
                    </div>

                    {/* Result Card */}
                    {searchResult && (
                        <div className="w-full md:w-auto min-w-[300px] border border-border rounded-lg bg-card p-4 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={searchResult.avatar_url} />
                                    <AvatarFallback>{searchResult.full_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-semibold text-foreground">{searchResult.full_name}</div>
                                    <div className="text-xs text-muted-foreground break-all">Usuario Registrado</div>
                                </div>

                                {requestStatus === 'idle' && (
                                    <Button size="sm" onClick={handleInvite} className="bg-indigo-600 hover:bg-indigo-700">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Conectar
                                    </Button>
                                )}
                                {requestStatus === 'sending' && (
                                    <Button size="sm" disabled variant="outline">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </Button>
                                )}
                                {requestStatus === 'sent' && (
                                    <Button size="sm" disabled variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Enviada
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
