'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { portalLoginAction } from '@/lib/actions/portal-auth'

export default function PortalLoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const res = await portalLoginAction(formData)

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        }
        // If success, the action redirects, so no need to stop loading manually
    }

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                        Consulta tus Reparaciones
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                        Ingresa a tu cuenta para ver el estado de tus equipos.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Acceso Clientes</CardTitle>
                        <CardDescription>Usa las credenciales proporcionadas por el taller.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input name="email" id="email" type="email" placeholder="cliente@ejemplo.com" required className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="password">Contraseña</Label>
                                <Input name="password" id="password" type="password" required className="mt-1" />
                            </div>

                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                                    {error}
                                </div>
                            )}

                            <Button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            <p className="text-slate-500">¿Olvidaste tu contraseña? Contacta al taller.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
