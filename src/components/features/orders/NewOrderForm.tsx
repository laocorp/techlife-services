'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Search, Check, ChevronsUpDown } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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
    customers: { id: string; full_name: string; tax_id?: string | null; phone?: string | null }[]
    technicians?: { id: string; full_name: string }[]
    hasHeadTechnician?: boolean
}

export default function NewOrderForm({ customers, technicians = [], hasHeadTechnician = false }: NewOrderFormProps) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [loadingAssets, setLoadingAssets] = useState(false)
    const [assets, setAssets] = useState<{ id: string; identifier: string; details?: any; notes?: string }[]>([])
    
    // Searchable Customer State
    const [open, setOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    // Helper to format asset display
    const formatAssetLabel = (asset: any) => {
        const parts = [asset.identifier]
        const make = asset.details?.make || asset.details?.brand
        const model = asset.details?.model

        if (make) parts.push(make)
        if (model) parts.push(model)

        let label = parts.join(' - ').toUpperCase()
        if (asset.alias) {
            label = `${asset.alias} | ${label}`
        }
        return label
    }

    const form = useForm<OrderFormData>({
        resolver: zodResolver(orderSchema),
        defaultValues: {
            priority: 'normal',
            assignedTo: 'unassigned', // Allow explicit unassigned or random default
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
            // Clean up assignedTo if 'unassigned' is passed
            const submissionData = { ...data }
            if (submissionData.assignedTo === 'unassigned') {
                submissionData.assignedTo = undefined
            }

            const res = await createOrderAction(submissionData)
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

                    {/* Searchable Customer Selection */}
                    <FormField
                        control={form.control}
                        name="customerId"
                        render={({ field }) => {
                            const selectedCustomer = customers.find(c => c.id === field.value);
                            const filteredCustomers = customers.filter(c => 
                                c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.tax_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                c.phone?.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            return (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Cliente</FormLabel>
                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={open}
                                                    className={cn(
                                                        "w-full justify-between text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {selectedCustomer ? (
                                                        <span className="truncate">
                                                            {selectedCustomer.full_name} {selectedCustomer.tax_id ? `- ${selectedCustomer.tax_id}` : ''}
                                                        </span>
                                                    ) : (
                                                        "Seleccionar Cliente"
                                                    )}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                            <div className="flex items-center border-b px-3">
                                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                                <input
                                                    className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                                    placeholder="Buscar por Nombre, CI o Celular..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <ScrollArea className="max-h-[300px] overflow-y-auto">
                                                {filteredCustomers.length === 0 ? (
                                                    <div className="py-6 text-center text-sm text-muted-foreground">
                                                        No se encontraron clientes.
                                                    </div>
                                                ) : (
                                                    <div className="p-1">
                                                        {filteredCustomers.map((customer) => (
                                                            <div
                                                                key={customer.id}
                                                                className={cn(
                                                                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                    field.value === customer.id && "bg-accent text-accent-foreground"
                                                                )}
                                                                onClick={() => {
                                                                    field.onChange(customer.id);
                                                                    onCustomerChange(customer.id);
                                                                    setOpen(false);
                                                                    setSearchQuery('');
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        field.value === customer.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{customer.full_name}</span>
                                                                    <span className="text-[11px] text-muted-foreground">
                                                                        {customer.tax_id ? `CI: ${customer.tax_id}` : 'Sin CI'} | {customer.phone ? `Cel: ${customer.phone}` : 'Sin Celular'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
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

                    {/* Smart Technician Assignment */}
                    {!hasHeadTechnician && technicians.length > 0 && (
                        <FormField
                            control={form.control}
                            name="assignedTo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Asignar Técnico</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || 'unassigned'}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar Técnico (Opcional)" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="unassigned">-- Sin Asignar --</SelectItem>
                                            {technicians.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[11px] text-muted-foreground">Puedes asignar a un técnico ahora o dejarlo para más tarde.</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {hasHeadTechnician && (
                        <div className="bg-blue-50/50 text-blue-700/80 text-xs p-3 rounded-md border border-blue-100 flex items-center justify-between">
                            <span>El equipo pasará a la fila del <strong>Jefe de Taller</strong> para su asignación.</span>
                        </div>
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
