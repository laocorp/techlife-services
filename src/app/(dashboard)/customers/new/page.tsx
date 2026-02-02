'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, Search, UserCheck, UserPlus, FileQuestion } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { CustomerFormData, customerSchema } from '@/lib/validations/customers'
import { createCustomerAction, searchCustomerByEmailAction } from '@/lib/actions/customers'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function NewCustomerPage() {
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [foundUser, setFoundUser] = useState<any | null>(null)
    const [manualMode, setManualMode] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    const form = useForm<CustomerFormData>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            fullName: '',
            taxId: '',
            email: '',
            phone: '',
            address: '',
        },
    })

    const emailValue = form.watch('email')

    // Smart Search Logic
    const handleEmailBlur = async () => {
        const email = form.getValues('email')
        if (!email || email.length < 5 || !email.includes('@')) return

        setSearching(true)
        setFoundUser(null)
        setManualMode(false)

        const result = await searchCustomerByEmailAction(email)
        setSearching(false)

        if (result.found && result.user) {
            setFoundUser(result.user)
            // Pre-fill name but keep editing disabled effectively by showing the "Found" card
            form.setValue('fullName', result.user.full_name || '')
        } else {
            // Not found -> Enable manual mode automatically
            setManualMode(true)
        }
    }

    async function onSubmit(data: CustomerFormData) {
        setLoading(true)
        setError(null)

        try {
            const result = await createCustomerAction(data)

            if (result?.error) {
                setError(result.error)
            } else {
                if (result?.invited) {
                    router.push('/customers?success=invited')
                } else {
                    router.push('/customers')
                }
                router.refresh()
            }
        } catch (err) {
            setError('Error inesperado')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Force enable manual mode (e.g. for users without email)
    const enableManualEntry = () => {
        setFoundUser(null)
        setManualMode(true)
        form.setValue('email', '') // Clear email if they want to register "without email" or just reset
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Link href="/customers" className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Clientes
            </Link>

            <h1 className="text-2xl font-bold text-foreground mb-2">Nuevo Cliente</h1>
            <p className="text-muted-foreground mb-8">
                Ingresa el email para conectar con un usuario existente, o registra uno nuevo manualmente.
            </p>

            <div className="bg-card p-6 rounded-lg shadow border border-border">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                        {/* STEP 1: EMAIL SEARCH */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-foreground">1. Buscar por Email</FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="cliente@ejemplo.com"
                                                    {...field}
                                                    onBlur={handleEmailBlur}
                                                    disabled={!!foundUser || loading}
                                                    className="text-lg"
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleEmailBlur}
                                                disabled={searching || !!foundUser || !field.value}
                                            >
                                                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                        <FormDescription>
                                            El sistema buscará si el usuario ya existe en TechLife.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* USER FOUND STATE */}
                            {foundUser && (
                                <Card className="bg-indigo-500/10 border-indigo-500/20 animate-in fade-in slide-in-from-top-2">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-indigo-200">
                                            <AvatarImage src={foundUser.avatar_url} />
                                            <AvatarFallback className="bg-indigo-100 text-indigo-700">
                                                {foundUser.full_name?.[0] || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-foreground flex items-center gap-2">
                                                {foundUser.full_name}
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                    <UserCheck className="w-3 h-3 mr-1" />
                                                    Usuario Existente
                                                </span>
                                            </h4>
                                            <p className="text-sm text-muted-foreground">Este usuario ya usa TechLife.</p>
                                        </div>
                                    </CardContent>
                                    <div className="bg-indigo-500/10 p-3 px-4 flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setFoundUser(null); form.setFocus('email'); }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                            Enviar Invitación
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* STEP 2: MANUAL ENTRY (Conditional) */}
                        {(!foundUser) && (
                            <div className={`space-y-6 pt-6 border-t border-border transition-all duration-500 ${manualMode ? 'opacity-100' : 'opacity-50 grayscale pointer-events-none'}`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-foreground">2. Datos del Cliente</h3>
                                    {!manualMode && (
                                        <Button type="button" variant="link" size="sm" onClick={enableManualEntry} className="text-muted-foreground">
                                            Saltar búsqueda / Cliente sin email
                                        </Button>
                                    )}
                                </div>

                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo / Razón Social *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ej. Juan Pérez" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="taxId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>ID Tributario</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="DNI / NIT" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+57 ..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Dirección completa" {...field} />
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

                                {manualMode && (
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Registrar Manualmente
                                    </Button>
                                )}
                            </div>
                        )}
                    </form>
                </Form>
            </div>
        </div>
    )
}
