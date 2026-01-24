'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CustomerProfileCard({ user, avatarUrl }: { user: any, avatarUrl: string | null }) {
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/avatar.${fileExt}`
        const filePath = `avatars/${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Update all customer records for this user
            const { error: dbError } = await supabase
                .from('customers')
                .update({ avatar_url: filePath })
                .eq('user_id', user.id)

            if (dbError) throw dbError

            toast({
                title: "Foto actualizada",
                description: "Tu foto de perfil se ha guardado.",
            })
            router.refresh()
        } catch (error) {
            console.error(error)
            toast({
                title: "Error al subir",
                variant: "destructive",
            })
        } finally {
            setUploading(false)
        }
    }

    // Helper for Avatar URL
    const displayUrl = avatarUrl
        ? (avatarUrl.startsWith('http')
            ? avatarUrl
            : supabase.storage.from('branding').getPublicUrl(avatarUrl).data.publicUrl)
        : null

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full border bg-slate-100 flex items-center justify-center overflow-hidden relative shrink-0">
                        {displayUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={displayUrl} alt="Perfil" className="w-full h-full object-cover" />
                        ) : (
                            <User className="h-8 w-8 text-slate-400" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="font-medium text-slate-900">{user.email}</div>
                        <Label htmlFor="avatar" className="cursor-pointer inline-block">
                            <div className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1">
                                <Upload className="h-3 w-3" />
                                Cambiar Foto
                            </div>
                            <Input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
