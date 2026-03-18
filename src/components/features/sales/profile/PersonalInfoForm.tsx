'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { updateStaffPhoneAction } from '@/lib/actions/staff-profile'
import { Loader2, Phone, Briefcase, Store, Mail, Hash } from 'lucide-react'

interface PersonalInfoFormProps {
    profile: any // Using any for flexibility with profile object structure
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
    const [loading, setLoading] = useState(false)
    const [phone, setPhone] = useState(profile.phone || '')

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updateStaffPhoneAction(phone)
            if (result.error) throw new Error(result.error)

            toast({
                title: "Información actualizada",
                description: "Tu número de teléfono se ha guardado.",
            })
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
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                    Información básica de tu cuenta. Contacta a tu gerente para actualizar otros datos.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Read Only Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email
                        </Label>
                        <div className="p-2 border rounded-md bg-muted/50 text-sm font-medium">
                            {profile.email}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Rol
                        </Label>
                        <div className="p-2 border rounded-md bg-muted/50 text-sm font-medium capitalize">
                            {profile.role?.replace('_', ' ') || 'Staff'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <Store className="w-4 h-4" /> Sucursal
                        </Label>
                        <div className="p-2 border rounded-md bg-muted/50 text-sm font-medium">
                            {profile.branch?.name || 'Principal'}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                            <Hash className="w-4 h-4" /> Código de Ventas
                        </Label>
                        <div className="p-2 border rounded-md bg-muted/50 text-sm font-medium">
                            {profile.sales_code || 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Editable Fields */}
                <form onSubmit={handleSave} className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Teléfono
                        </Label>
                        <Input
                            id="phone"
                            placeholder="+1 234 567 890"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
