import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Store } from 'lucide-react'

// Allow retrieving searchParams
export default async function OrderSuccessPage({
    searchParams,
}: {
    searchParams: { orderId: string }
}) {
    // In Next.js 15 searchParams might be async, but in 14 it's safe. 
    // Just to be safe for future warning:
    const { orderId } = await searchParams

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="h-24 w-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>

            <h1 className="text-4xl font-extrabold text-foreground mb-4">¡Gracias por tu compra!</h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8">
                Tu pedido ha sido recibido correctamente. Te hemos enviado un correo de confirmación con los detalles.
            </p>

            <div className="bg-card p-6 rounded-xl border border-border shadow-sm mb-8 w-full max-w-md">
                <p className="text-sm text-muted-foreground mb-1">Número de Orden</p>
                <p className="font-mono text-xl font-bold text-foreground">#{orderId?.split('-')[0] || 'PENDING'}</p>
            </div>

            <div className="flex gap-4">
                <Link href="/store">
                    <Button variant="outline">Volver a la Tienda</Button>
                </Link>
                <Link href="/portal/dashboard">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex gap-2">
                        <Store className="h-4 w-4" />
                        Volver al Hub
                    </Button>
                </Link>
            </div>
        </div>
    )
}
