import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ShoppingBag } from 'lucide-react'

// Allow retrieving searchParams
export default function OrderSuccessPage({
    searchParams,
}: {
    searchParams: { orderId: string }
}) {
    // In Next.js 15 searchParams might be async, but in 14 it's safe. 
    // Just to be safe for future warning:
    const { orderId } = searchParams

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
            <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>

            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">¡Gracias por tu compra!</h1>
            <p className="text-lg text-slate-600 max-w-lg mb-8">
                Tu pedido ha sido recibido correctamente. Te hemos enviado un correo de confirmación con los detalles.
            </p>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 w-full max-w-md">
                <p className="text-sm text-slate-500 mb-1">Número de Orden</p>
                <p className="font-mono text-xl font-bold text-slate-900">#{orderId?.split('-')[0] || 'PENDING'}</p>
            </div>

            <div className="flex gap-4">
                <Link href="/store">
                    <Button variant="outline">Volver a la Tienda</Button>
                </Link>
                {/* Future: Link to order tracking if we build it */}
                {/* <Link href={`/track?order=${orderId}`}>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">Rastrear Pedido</Button>
                </Link> */}
            </div>
        </div>
    )
}
