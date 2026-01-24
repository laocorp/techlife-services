'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

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
    const [assets, setAssets] = useState<{ id: string; identifier: string }[]>([])

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            priority: 'normal',
        },
    })

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
                                                {a.identifier}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {assets.length === 0 && form.watch('customerId') && !loadingAssets && (
                                    <p className="text-xs text-muted-foreground mt-1">Este cliente no tiene equipos registrados.</p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />

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
