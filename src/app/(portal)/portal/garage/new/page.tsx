'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client' // Use client-side for immediate feedback interaction
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function NewAssetPage() {
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState('automotive')
    const router = useRouter()
    const { toast } = useToast()
    const supabase = createClient()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from('user_assets').insert({
                user_id: user?.id,
                type: type,
                identifier: formData.get('identifier'),
                alias: formData.get('alias'),
                details: {
                    make: formData.get('make'),
                    model: formData.get('model'),
                    year: formData.get('year'),
                    color: formData.get('color'),
                    serial: formData.get('serial') // For electronics
                }
            })

            if (error) throw error

            toast({ title: 'Activo registrado', className: "bg-green-500 text-white" })
            router.push('/portal/garage')
            router.refresh()
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Registrar Nuevo Activo</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Tipo de Activo</Label>
                            <Select name="type" defaultValue="automotive" onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona tipo" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50">
                                    <SelectItem value="automotive">Vehículo (Auto/Moto)</SelectItem>
                                    <SelectItem value="electronics">Dispositivo Electrónico</SelectItem>
                                    <SelectItem value="machinery">Maquinaria / Herramienta</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fields for Automotive */}
                        {type === 'automotive' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Placa / Patente *</Label>
                                        <Input name="identifier" required placeholder="ABC-123" className="uppercase" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alias (Opcional)</Label>
                                        <Input name="alias" placeholder="Ej. El Rojo" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Marca</Label>
                                        <Input name="make" placeholder="Toyota" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Modelo</Label>
                                        <Input name="model" placeholder="Corolla" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Año</Label>
                                        <Input name="year" type="number" placeholder="2020" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Color</Label>
                                        <Input name="color" placeholder="Gris" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Fields for Electronics */}
                        {type === 'electronics' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Número de Serie / IMEI *</Label>
                                        <Input name="identifier" required placeholder="SN12345678" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nombre / Alias</Label>
                                        <Input name="alias" placeholder="Ej. Laptop de Juan" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Tipo / Categoría</Label>
                                        <Input name="make" placeholder="Ej. Smartphone, Laptop, Tablet..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Marca</Label>
                                        <Input name="model" placeholder="Apple, Samsung..." />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Modelo / Referencia</Label>
                                        <Input name="model" placeholder="iPhone 15 Pro, Galaxy S24..." />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Fields for Machinery */}
                        {type === 'machinery' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>ID Interno / Serial *</Label>
                                        <Input name="identifier" required placeholder="MQ-001" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alias (Opcional)</Label>
                                        <Input name="alias" placeholder="Ej. Taladro Percutor" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Marca</Label>
                                        <Input name="make" placeholder="Bosch, Makita..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Modelo</Label>
                                        <Input name="model" placeholder="GSB 18V..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Año de Compra</Label>
                                        <Input name="year" type="number" placeholder="2023" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="pt-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Guardar Registro
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
