
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'

export default function SecurityForm() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirmPassword = formData.get('confirmPassword') as string

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (error) {
            toast.error(`Error: ${error.message}`)
        } else {
            toast.success('Contraseña actualizada correctamente')
            // Optionally reset the form
            e.currentTarget.reset()
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="pl-9 bg-background text-foreground"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="pl-9 bg-background text-foreground"
                    />
                </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full" variant="outline">
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
        </form>
    )
}
