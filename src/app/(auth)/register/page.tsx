'use client'
import Image from 'next/image'



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
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

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
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [userSession, setUserSession] = useState<any>(null)

    const isClient = type === 'client'

    useEffect(() => {
        const checkSession = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserSession(user)
        }
        checkSession()
    }, [supabase])

    // ... forms setup ...

    async function handleLogout() {
        await supabase.auth.signOut()
        setUserSession(null)
        router.refresh()
    }

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
            {userSession && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-900 dark:text-blue-200 flex flex-col gap-3">
                    <div className="font-semibold">
                        Ya tienes una sesión activa como <span className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">{userSession.email}</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                            onClick={() => router.push(isClient ? '/portal/dashboard' : '/dashboard')}
                        >
                            Ir al Panel
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 w-full"
                            onClick={handleLogout}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                    <div className="text-xs text-blue-600/80 dark:text-blue-400 text-center">
                        Para crear una cuenta nueva, primero cierra sesión.
                    </div>
                </div>
            )}

            <div className="mb-8 text-center space-y-3 flex flex-col items-center">
                <Image
                    src="/logo_transparent.png"
                    alt="Logo"
                    width={64}
                    height={64}
                    className="mb-2 object-contain"
                />
                <div className={`mx-auto h-12 w-12 rounded-xl flex items-center justify-center ${isClient ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-slate-900 dark:bg-indigo-600 text-white'}`}>
                    {isClient ? <User className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
                    {isClient ? 'Cuenta Personal' : 'Registrar Taller'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
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
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Nombre Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Tu nombre" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={clientForm.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="tu@email.com" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={clientForm.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {error && <div className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}
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
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Nombre del Admin</FormLabel>
                                <FormControl>
                                    <Input placeholder="Juan Pérez" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="companyName" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Nombre del Taller</FormLabel>
                                <FormControl>
                                    <Input placeholder="ElectroFix" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="industry" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Industria</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                        <SelectItem value="automotive">Automotriz</SelectItem>
                                        <SelectItem value="electronics">Electrónica</SelectItem>
                                        <SelectItem value="machinery">Maquinaria</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="email" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="admin@taller.com" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={workshopForm.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {error && <div className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 p-2 rounded">{error}</div>}
                        <Button type="submit" className="w-full bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700" disabled={loading}>
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
        <Suspense fallback={<div className="text-slate-500 dark:text-slate-400">Cargando...</div>}>
            <RegisterFormContent />
        </Suspense>
    )
}
