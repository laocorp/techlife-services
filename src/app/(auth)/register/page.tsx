'use client'

import { useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User, Building2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { RegisterFormData, registerSchema } from '@/lib/validations/auth'
import { signUpAction } from '@/lib/actions/auth'
import { signUpClientAction, ClientRegisterFormData } from '@/lib/actions/auth_client'
import { z } from 'zod'

// Client Schema (Inline for simplicity or import)
const clientSchema = z.object({
    fullName: z.string().min(2, "Nombre requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
})

function RegisterFormContent() {
    const searchParams = useSearchParams()
    const type = searchParams.get('type') || 'workshop' // 'workshop' | 'client'
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isClient = type === 'client'

    // We use different forms/schemas based on type, but for simplicity in this component
    // we can use separate logic blocks or a unified conditional form.
    // Let's use two separate form setups to avoid type clashes.

    // --- WORKSHOP FORM ---
    const workshopForm = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: { fullName: '', email: '', password: '', companyName: '', industry: undefined },
    })

    // --- CLIENT FORM ---
    const clientForm = useForm<ClientRegisterFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: { fullName: '', email: '', password: '' },
    })

    async function onWorkshopSubmit(data: RegisterFormData) {
        setLoading(true); setError(null)
        try {
            const res = await signUpAction(data)
            if (res.error) setError(res.error)
            else router.push('/dashboard')
        } catch (e) { setError('Error inesperado'); console.error(e) }
        finally { setLoading(false) }
    }

    async function onClientSubmit(data: ClientRegisterFormData) {
        setLoading(true); setError(null)
        try {
            const res = await signUpClientAction(data)
            if (res.error) setError(res.error)
            else router.push('/portal/dashboard') // Redirect to Client Portal
        } catch (e) { setError('Error inesperado'); console.error(e) }
        finally { setLoading(false) }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center space-y-2">
                <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center ${isClient ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-900 text-white'}`}>
                    {isClient ? <User className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <h1 className="text-2xl font-bold text-slate-900">
                    {isClient ? 'Cuenta Personal' : 'Registrar Taller'}
                </h1>
                <p className="text-sm text-slate-500">
                    {isClient
                        ? 'Gestiona tus reparaciones y compras.'
                        : 'Administra tu negocio de servicio técnico.'}
                </p>
            </div>

            {isClient ? (
                // CLIENT FORM
                <Form {...clientForm}>
                    <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
                        <FormField control={clientForm.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Nombre Completo</FormLabel><FormControl><Input placeholder="Tu nombre" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={clientForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="tu@email.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={clientForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" placeholder="******" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Registrarse
                        </Button>
                    </form>
                </Form>
            ) : (
                // WORKSHOP FORM
                <Form {...workshopForm}>
                    <form onSubmit={workshopForm.handleSubmit(onWorkshopSubmit)} className="space-y-4">
                        <FormField control={workshopForm.control} name="fullName" render={({ field }) => (
                            <FormItem><FormLabel>Nombre del Admin</FormLabel><FormControl><Input placeholder="Juan Pérez" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="companyName" render={({ field }) => (
                            <FormItem><FormLabel>Nombre del Taller</FormLabel><FormControl><Input placeholder="ElectroFix" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="industry" render={({ field }) => (
                            <FormItem><FormLabel>Industria</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl><SelectContent><SelectItem value="automotive">Automotriz</SelectItem><SelectItem value="electronics">Electrónica</SelectItem><SelectItem value="machinery">Maquinaria</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="admin@taller.com" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="password" render={({ field }) => (
                            <FormItem><FormLabel>Contraseña</FormLabel><FormControl><Input type="password" placeholder="******" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />

                        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear Cuenta Taller
                        </Button>
                    </form>
                </Form>
            )}
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <RegisterFormContent />
        </Suspense>
    )
}
