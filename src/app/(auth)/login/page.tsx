'use client'
import Image from 'next/image'



import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { loginSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { z } from 'zod'

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(data: LoginFormData) {
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            })

            if (error) {
                setError(error.message)
            } else {
                // Check role to redirect correctly
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single()

                    if (profile?.role === 'client') {
                        // Force full reload to ensure middleware and cookies are processed correctly
                        window.location.href = '/portal/dashboard'
                    } else {
                        window.location.href = '/dashboard'
                    }
                    // router.refresh() is not needed with window.location.href as the page unloads
                }
            }
        } catch (err) {
            setError('Ocurrió un error inesperado al iniciar sesión.')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }


    // ...

    return (
        <div>
            <div className="mb-6 text-center flex flex-col items-center">
                <Image
                    src="/logo_transparent.png"
                    alt="Logo"
                    width={64}
                    height={64}
                    className="mb-4 object-contain"
                />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Iniciar Sesión</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Accede a TechLife Service</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Email</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="admin@taller.com"
                                        {...field}
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-slate-300">Contraseña</FormLabel>
                                <FormControl>
                                    <Input
                                        type="password"
                                        placeholder="******"
                                        {...field}
                                        className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {error && (
                        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                    </Button>

                    <div className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
                        ¿No tienes cuenta? <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline">Registra tu taller</Link>
                    </div>
                </form>
            </Form>
        </div>
    )
}
