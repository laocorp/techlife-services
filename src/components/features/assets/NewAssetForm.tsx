'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea' // Assuming we have it or will use Input
import { AssetFormData, assetSchema } from '@/lib/validations/assets'
import { createAssetAction } from '@/lib/actions/assets'

// We need to know the industry. In a real app we might pass this as a prop or fetch it.
// For now, let's assume we can pass it via props if this was a component, or fetch it.
// To keep it simple, we'll fetch the user profile in a server component wrapper, OR just use 'automotive' default 
// and maybe fetch it client side? No, simpler: 
// The PARENT page knows the industry. We can pass it if we made this a component.
// But this IS a page. 
// Let's rely on the Server Action to handle the logic, but the UI needs to adapt LABELS.
// We'll accept a prop 'industry' from the server page wrapper.

export default function NewAssetForm({
    customerId,
    industry
}: {
    customerId: string,
    industry: 'automotive' | 'electronics' | 'machinery'
}) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const form = useForm<AssetFormData>({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            identifier: '',
            brand: '',
            model: '',
            notes: '',
        },
    })

    async function onSubmit(data: AssetFormData) {
        setLoading(true)
        setError(null)

        try {
            const result = await createAssetAction(customerId, data, industry)

            if (result?.error) {
                setError(result.error)
            } else {
                router.push(`/customers/${customerId}`)
                router.refresh()
            }
        } catch (err) {
            setError('Error inesperado')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Dynamic Labels
    const labels = {
        identifier: industry === 'automotive' ? 'Placa / Patente' : industry === 'electronics' ? 'IMEI / Número de Serie' : 'Serial / ID Interno',
        brand: 'Marca',
        model: 'Modelo'
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    <FormField
                        control={form.control}
                        name="identifier"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">{labels.identifier}</FormLabel>
                                <p className="text-xs text-slate-500">Identificador único del equipo.</p>
                                <FormControl>
                                    <Input placeholder={industry === 'automotive' ? 'ABC-123' : '3548...'} {...field} className="uppercase" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="brand"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{labels.brand}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Toyota, Samsung..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="model"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{labels.model}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej. Corolla, S24..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Notas / Descripción</FormLabel>
                                <FormControl>
                                    <Input placeholder="Color rojo, rayón en la pantalla..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Registrar Equipo
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    )
}
