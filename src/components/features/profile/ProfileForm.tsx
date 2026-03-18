'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Users, Upload, Save, Loader2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { updateProfileAction } from '@/lib/actions/profile'
import { updateStaffAvatarAction } from '@/lib/actions/staff-profile'
import { createClient } from '@/lib/supabase/client'

interface ProfileFormProps {
    user: any
    profile: any
}

export default function ProfileForm({ user, profile }: ProfileFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')

    // Handle Profile Info Update
    async function handleUpdate(formData: FormData) {
        setLoading(true)
        try {
            const result = await updateProfileAction(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Perfil actualizado correctamente')
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error('Error al actualizar perfil')
        } finally {
            setLoading(false)
        }
    }

    // Handle Avatar Upload
    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) {
            return
        }

        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        setUploading(true)
        try {
            const supabase = createClient()

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update Profile in DB using Server Action
            const result = await updateStaffAvatarAction(publicUrl)

            if (result?.error) {
                toast.error(result.error)
            } else {
                setAvatarUrl(publicUrl)
                toast.success('Foto de perfil actualizada')
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            toast.error('Error al subir imagen: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* AVATAR CARD */}
            <Card>
                <CardHeader>
                    <CardTitle>Foto de Perfil</CardTitle>
                    <CardDescription>
                        Esta imagen será visible para tu equipo y clientes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center space-y-6">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-xl relative">
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <Users className="w-12 h-12 text-slate-400" />
                                </div>
                            )}

                            {/* Overlay for upload */}
                            <label
                                htmlFor="avatar-upload"
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <Camera className="w-8 h-8 text-white" />
                            </label>
                        </div>

                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 rounded-full z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                            disabled={uploading}
                        />
                        <Button
                            variant="outline"
                            disabled={uploading}
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                            {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                            JPG, PNG o WEBP. Máximo 2MB.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* PERSONAL INFO CARD */}
            <Card>
                <CardHeader>
                    <CardTitle>Información Personal</CardTitle>
                    <CardDescription>
                        Actualiza tus datos de contacto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={profile?.email || user?.email}
                                disabled
                                className="bg-slate-50 dark:bg-slate-900"
                            />
                            <p className="text-xs text-muted-foreground">
                                El email no se puede cambiar. Contacta al admin.
                            </p>
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
                                placeholder="+57 300 123 4567"
                            />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
