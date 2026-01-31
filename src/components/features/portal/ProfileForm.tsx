'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfileAction } from '@/lib/actions/profile'
import { toast } from 'sonner'

export default function ProfileForm({ profile }: { profile: any }) {
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const result = await updateProfileAction(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Perfil actualizado correctamente')
        }
    }

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-slate-50 text-slate-500"
                />
                <p className="text-xs text-slate-400">El correo no se puede cambiar.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                    id="full_name"
                    name="full_name"
                    defaultValue={profile?.full_name || ''}
                    placeholder="Ej: Juan Pérez"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                    id="phone"
                    name="phone"
                    defaultValue={profile?.phone || ''}
                    placeholder="+58 412 1234567"
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
        </form>
    )
}
