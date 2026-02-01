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
                        router.push('/portal/dashboard')
                    } else {
                        router.push('/dashboard')
                    }
                    router.refresh()
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
                    src="/logo.png"
                    alt="Logo"
                    width={64}
                    height={64}
                    className="mb-4 object-contain"
                />
                <h1 className="text-2xl font-bold text-slate-900">Iniciar Sesión</h1>
                <p className="text-sm text-slate-500">Accede a TechLife Service</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="admin@taller.com" {...field} />
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
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="******" {...field} />
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

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                    </Button>

                    <div className="text-center text-sm text-slate-500 mt-4">
                        ¿No tienes cuenta? <Link href="/register" className="text-indigo-600 hover:underline">Registra tu taller</Link>
                    </div>
                </form>
            </Form>
        </div>
    )
}
