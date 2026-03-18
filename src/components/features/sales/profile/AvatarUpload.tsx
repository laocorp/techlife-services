'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateStaffAvatarAction } from '@/lib/actions/staff-profile'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { Camera, Loader2, Upload } from 'lucide-react'

interface AvatarUploadProps {
    currentAvatarUrl: string | null
    userId: string
    userName: string
}

export default function AvatarUpload({ currentAvatarUrl, userId, userName }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
    const supabase = createClient()

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)

            if (!e.target.files || e.target.files.length === 0) {
                return
            }

            const file = e.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${userId}/${Math.random()}.${fileExt}`
            const fullPath = `avatars/${filePath}`

            // 1. Upload to Supabase Storage
            // Try 'avatars' bucket first, fallback to 'branding'? 
            // Plan says use 'avatars'. If it fails, we handle error.

            // Check if bucket exists/upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                console.error('Upload Error:', uploadError)
                // Fallback or detailed error
                throw new Error('Error al subir la imagen. Verifica que el bucket "avatars" exista y sea público.')
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update Profile
            const result = await updateStaffAvatarAction(publicUrl)

            if (result.error) {
                throw new Error(result.error)
            }

            setAvatarUrl(publicUrl)
            toast({
                title: "Foto actualizada",
                description: "Tu foto de perfil se ha actualizado correctamente.",
            })

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={avatarUrl || ''} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-muted">
                        {userName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-colors"
                >
                    {uploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Camera className="w-5 h-5" />
                    )}
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={uploading}
                    />
                </label>
            </div>
            <p className="text-sm text-muted-foreground">
                Haz clic en la cámara para cambiar tu foto
            </p>
        </div>
    )
}
