'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { updatePasswordAction } from '@/lib/actions/auth'
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react'

export default function SecuritySettings() {
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password.length < 6) {
            toast({
                title: "Contraseña insegura",
                description: "La contraseña debe tener al menos 6 caracteres.",
                variant: "destructive"
            })
            return
        }

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Las contraseñas no coinciden.",
                variant: "destructive"
            })
            return
        }

        setLoading(true)

        try {
            const result = await updatePasswordAction(password)
            if (result.error) throw new Error(result.error)

            toast({
                title: "Contraseña actualizada",
                description: "Tu contraseña ha sido cambiada exitosamente.",
            })
            setPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    Seguridad
                </CardTitle>
                <CardDescription>
                    Protege tu cuenta actualizando tu contraseña periódicamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-password">Nueva Contraseña</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="******"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                        <div className="relative">
                            <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="******"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading} variant="secondary">
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Actualizar Contraseña
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
