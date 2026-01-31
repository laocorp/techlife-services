'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, Building2 } from 'lucide-react'
import { updateTenantProfile } from '@/lib/actions/settings'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function WorkshopSettingsForm({ tenant }: { tenant: any }) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const { toast } = useToast()
    const router = useRouter()
    const supabase = createClient()

    async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        setUploading(true)
        const file = e.target.files[0]
        const fileExt = file.name.split('.').pop()
        const fileName = `${tenant.id}/logo.${fileExt}`
        const filePath = `${fileName}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            // Update DB
            const { error: dbError } = await supabase
                .from('tenants')
                .update({ logo_url: filePath })
                .eq('id', tenant.id)

            if (dbError) throw dbError

            toast({
                title: "Logo actualizado",
                description: "La imagen se ha subido correctamente.",
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

    // Standard Form Action wrapper
    async function onSubmit(formData: FormData) {
        setLoading(true)
        try {
            await updateTenantProfile(formData)
            toast({ title: "Perfil actualizado" })
        } catch (error) {
            toast({ title: "Error", variant: "destructive" })
        } finally {
            setLoading(false)
        }
    }

    // Helper to get public URL for preview
    const logoUrl = tenant.logo_url
        ? (tenant.logo_url.startsWith('http')
            ? tenant.logo_url
            : supabase.storage.from('branding').getPublicUrl(tenant.logo_url).data.publicUrl)
        : null

    return (
        <Card>
            <CardHeader>
                <CardTitle>Perfil del Taller</CardTitle>
                <CardDescription>Esta información aparecerá en los informes impresos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Logo Section */}
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-lg border bg-slate-100 flex items-center justify-center overflow-hidden relative">
                        {logoUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="h-10 w-10 text-slate-400" />
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="logo" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                <Upload className="h-4 w-4" />
                                Subir Logo
                            </div>
                            <Input
                                id="logo"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                                disabled={uploading}
                            />
                        </Label>
                        <p className="text-xs text-slate-500 mt-1">Recomendado: PNG o JPG, fondo transparente.</p>
                    </div>
                </div>

                {/* Form Fields */}
                <form action={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre del Taller</Label>
                            <Input id="name" name="name" defaultValue={tenant.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono de Contacto</Label>
                            <Input id="phone" name="contact_phone" defaultValue={tenant.contact_phone} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Público</Label>
                            <Input id="email" name="contact_email" defaultValue={tenant.contact_email} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Sitio Web</Label>
                            <Input id="website" name="website" defaultValue={tenant.website} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección Física</Label>
                        <Input id="address" name="address" defaultValue={tenant.address} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">Ciudad / Región</Label>
                        <Input id="city" name="city" defaultValue={tenant.city} />
                    </div>

                    <div className="border-t pt-4">
                        <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-slate-500" />
                            Datos Bancarios (Para Transferencias)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="bank_name">Banco</Label>
                                <Input id="bank_name" name="bank_name" defaultValue={tenant.settings?.bank_account?.bank_name} placeholder="Ej. Banco Pichincha" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_type">Tipo de Cuenta</Label>
                                <select
                                    id="account_type"
                                    name="account_type"
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    defaultValue={tenant.settings?.bank_account?.account_type || 'Ahorros'}
                                >
                                    <option value="Ahorros">Ahorros</option>
                                    <option value="Corriente">Corriente</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_number">Número de Cuenta</Label>
                                <Input id="account_number" name="account_number" defaultValue={tenant.settings?.bank_account?.account_number} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="account_holder">Titular de la Cuenta</Label>
                                <Input id="account_holder" name="account_holder" defaultValue={tenant.settings?.bank_account?.account_holder} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="holder_id">C.I. / RUC del Titular</Label>
                                <Input id="holder_id" name="holder_id" defaultValue={tenant.settings?.bank_account?.holder_id} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
