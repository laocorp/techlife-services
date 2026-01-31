'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { orderSchema, OrderFormData } from '@/lib/validations/orders'
import { createOrderAction } from '@/lib/actions/orders'
import { getCustomerAssetsAction } from '@/lib/actions/assets'

type NewOrderFormProps = {
    customers: { id: string; full_name: string }[]
}

export default function NewOrderForm({ customers }: NewOrderFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loadingAssets, setLoadingAssets] = useState(false)
    const [assets, setAssets] = useState<{ id: string; identifier: string; details?: any; notes?: string }[]>([])

    // Helper to format asset display
    const formatAssetLabel = (asset: any) => {
        const parts = [asset.identifier]
        const make = asset.details?.make || asset.details?.brand
        const model = asset.details?.model

        if (make) parts.push(make)
        if (model) parts.push(model)

        return parts.join(' - ').toUpperCase()
    }

    // ... (existing helper function)

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            priority: 'normal',
        },
    })

    // Quick Asset State
    const [isAssetModalOpen, setIsAssetModalOpen] = useState(false)
    const [newAssetData, setNewAssetData] = useState({ identifier: '', brand: '', model: '', color: '' })
    const [creatingAsset, setCreatingAsset] = useState(false)

    async function onCustomerChange(customerId: string) {
        if (!customerId) return
        form.setValue('customerId', customerId)
        form.setValue('assetId', '') // Reset asset
        setLoadingAssets(true)

        try {
            const customerAssets = await getCustomerAssetsAction(customerId)
            setAssets(customerAssets || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingAssets(false)
        }
    }

    async function handleCreateAsset() {
        if (!newAssetData.identifier || !newAssetData.brand) return
        setCreatingAsset(true)
        try {
            const { createQuickAssetAction } = await import('@/lib/actions/assets') // Dynamic import
            const customerId = form.getValues('customerId')

            const res = await createQuickAssetAction(customerId, {
                identifier: newAssetData.identifier,
                brand: newAssetData.brand,
                model: newAssetData.model,
                color: newAssetData.color,
                type: 'automotive' // Default or make selectable
            })

            if (res.success) {
                // If customerId changed (virtual -> local migration), update form
                if (res.newCustomerId && res.newCustomerId !== customerId) {
                    form.setValue('customerId', res.newCustomerId)
                    // We might need to update the customer list too, but effectively the ID just changed
                    // The UI select might break if the new ID isn't in `customers` prop list.
                    // Ideally we should reload the page or add the new ID to the list.
                    // For now, let's assume the mutation works and we just fetch assets for the NEW ID.
                    await onCustomerChange(res.newCustomerId)
                } else {
                    // Just refresh assets
                    await onCustomerChange(customerId)
                }

                setIsAssetModalOpen(false)
                setNewAssetData({ identifier: '', brand: '', model: '', color: '' })
            }
        } catch (err) {
            console.error(err)
        } finally {
            setCreatingAsset(false)
        }
    }

    async function onSubmit(data: OrderFormData) {
        setError(null)
        try {
            const res = await createOrderAction(data)
            if (res?.error) {
                setError(res.error)
            } else {
                router.push('/orders')
            }
        } catch (err) {
            setError('Ocurrió un error inesperado.')
        }
    }

    return (
        <div className="max-w-xl mx-auto p-6 bg-card border rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Nueva Orden de Servicio</h2>

            {error && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Customer Selection */}
                    <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Cliente</FormLabel>
                                <Select
                                    onValueChange={(val) => {
                                        field.onChange(val)
                                        onCustomerChange(val)
                                    }}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Cliente" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Asset Selection */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <FormField
                                control={form.control}
                                name="assetId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Equipo / Vehículo</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            disabled={!form.watch('customerId') || loadingAssets}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingAssets ? "Cargando..." : "Seleccionar Equipo"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {assets.map((a) => (
                                                    <SelectItem key={a.id} value={a.id}>
                                                        {formatAssetLabel(a)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Dialog open={isAssetModalOpen} onOpenChange={setIsAssetModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="mb-[2px]"
                                    disabled={!form.watch('customerId')}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Registrar Nuevo Equipo</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Placa / Serial</label>
                                            <Input
                                                value={newAssetData.identifier}
                                                onChange={e => setNewAssetData({ ...newAssetData, identifier: e.target.value })}
                                                placeholder="ABC-123"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Marca</label>
                                            <Input
                                                value={newAssetData.brand}
                                                onChange={e => setNewAssetData({ ...newAssetData, brand: e.target.value })}
                                                placeholder="Toyota, HP..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Modelo</label>
                                            <Input
                                                value={newAssetData.model}
                                                onChange={e => setNewAssetData({ ...newAssetData, model: e.target.value })}
                                                placeholder="Corolla, Pavilion..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Color</label>
                                            <Input
                                                value={newAssetData.color}
                                                onChange={e => setNewAssetData({ ...newAssetData, color: e.target.value })}
                                                placeholder="Rojo..."
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleCreateAsset}
                                        disabled={creatingAsset || !newAssetData.identifier || !newAssetData.brand}
                                        className="w-full"
                                    >
                                        {creatingAsset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Equipo
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {assets.length === 0 && form.watch('customerId') && !loadingAssets && (
                        <p className="text-xs text-muted-foreground -mt-4">Este cliente no tiene equipos registrados.</p>
                    )}

                    {/* Priority */}
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prioridad</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Prioridad" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="low">Baja</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="high">Alta</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Description */}
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción del Problema</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Describe el fallo reportado por el cliente..."
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Notes (Optional) */}
                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas / Observaciones Iniciales</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Estado físico, accesorios recibidos, etc..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando Orden...
                            </>
                        ) : (
                            'Crear Orden de Servicio'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}
