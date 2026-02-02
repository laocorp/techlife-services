'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Key, Copy, Check } from 'lucide-react'
import { enablePortalAccessAction } from '@/lib/actions/portal-admin'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EnablePortalButtonProps {
    customerId: string
    email: string | null
    hasUser: boolean
}

export default function EnablePortalButton({ customerId, email, hasUser }: EnablePortalButtonProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [successData, setSuccessData] = useState<{ tempPassword: string } | null>(null)
    const [copied, setCopied] = useState(false)

    const handleEnable = async () => {
        if (!email) return

        setLoading(true)
        try {
            const res = await enablePortalAccessAction(customerId, email)
            if (res.error) {
                alert(`Error: ${res.error}`)
            } else {
                setSuccessData({ tempPassword: res.tempPassword || '' })
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`)
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (successData?.tempPassword) {
            navigator.clipboard.writeText(successData.tempPassword)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Only show "Already Active" badge if we haven't just successfully created the user
    // This prevents the Dialog from disappearing when the server revalidates and sends new props
    if (hasUser && !successData) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                Portal Activo
            </span>
        )
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    size="sm"
                    className="h-7 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20 text-indigo-600 font-semibold"
                    disabled={!email}
                    title={!email ? 'Sin email registrado' : 'Generar acceso'}
                >
                    <Key className="h-3 w-3 mr-1" />
                    Habilitar Portal
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Habilitar Acceso al Portal</DialogTitle>
                    <DialogDescription>
                        Se creará un usuario para <strong>{email}</strong> y se generará una contraseña temporal.
                    </DialogDescription>
                </DialogHeader>

                {!successData ? (
                    <div className="flex justify-end pt-4">
                        <Button variant="ghost" onClick={() => setOpen(false)} className="mr-2">Cancelar</Button>
                        <Button onClick={handleEnable} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading ? 'Generando...' : 'Confirmar y Generar'}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-md p-3 text-sm text-green-600">
                            ¡Usuario creado correctamente!
                        </div>

                        <div className="space-y-2">
                            <Label>Contraseña Temporal</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    readOnly
                                    value={successData.tempPassword}
                                    className="font-mono text-lg bg-muted"
                                />
                                <Button size="icon" variant="outline" onClick={copyToClipboard}>
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Comparte esta contraseña con el cliente. Podrá cambiarla después.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button onClick={() => window.location.reload()}>
                                Cerrar y Actualizar
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
