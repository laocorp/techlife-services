'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, MapPin, Mail, Phone, User } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function EcommerceOrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.id as string
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchOrder = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/portal/login')
                return
            }

            const { data, error } = await supabase
                .from('ecommerce_orders')
                .select(`
                    *,
                    items:ecommerce_order_items (
                        *,
                        products (name, image_url)
                    ),
                    tenants (name, logo_url)
                `)
                .eq('id', orderId)
                .eq('user_id', user.id)
                .single()

            if (error || !data) {
                console.error('Error fetching order:', error)
                router.push('/portal/dashboard')
                return
            }

            setOrder(data)
            setLoading(false)
        }

        fetchOrder()
    }, [orderId, router, supabase])

    const getStatusBadge = (status: string, paymentStatus: string) => {
        if (paymentStatus !== 'paid') {
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Pago Pendiente</Badge>
        }
        switch (status) {
            case 'pending':
                return <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">En Preparación</Badge>
            case 'shipped':
                return <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Enviado</Badge>
            case 'delivered':
                return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Entregado</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getStatusIcon = (status: string, paymentStatus: string) => {
        if (paymentStatus !== 'paid') return <Clock className="h-6 w-6 text-yellow-500" />
        switch (status) {
            case 'pending':
                return <Package className="h-6 w-6 text-blue-500" />
            case 'shipped':
                return <Truck className="h-6 w-6 text-purple-500" />
            case 'delivered':
                return <CheckCircle className="h-6 w-6 text-green-500" />
            default:
                return <Package className="h-6 w-6" />
        }
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    if (!order) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <p className="text-slate-500 dark:text-slate-400">Orden no encontrada</p>
                <Link href="/portal/dashboard">
                    <Button variant="outline" className="mt-4">Volver al Dashboard</Button>
                </Link>
            </div>
        )
    }

    const address = order.shipping_address || {}

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {/* Back Button */}
            <Link href="/portal/dashboard">
                <Button variant="ghost" size="sm" className="-ml-4 text-muted-foreground">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                </Button>
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-3">
                    {getStatusIcon(order.status, order.payment_status)}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Orden #{order.id.slice(0, 8)}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {new Date(order.created_at).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>
                {getStatusBadge(order.status, order.payment_status)}
            </div>

            {/* Status Progress */}
            {order.payment_status === 'paid' && (
                <Card className="bg-card dark:bg-slate-800/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className={`flex flex-col items-center ${['pending', 'shipped', 'delivered'].includes(order.status) ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${['pending', 'shipped', 'delivered'].includes(order.status) ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <span className="text-xs mt-2">Pagado</span>
                            </div>
                            <div className={`flex-1 h-1 mx-2 ${['pending', 'shipped', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-muted'}`} />
                            <div className={`flex flex-col items-center ${['pending', 'shipped', 'delivered'].includes(order.status) ? 'text-blue-600' : 'text-muted-foreground'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${['pending', 'shipped', 'delivered'].includes(order.status) ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'}`}>
                                    <Package className="h-5 w-5" />
                                </div>
                                <span className="text-xs mt-2">Preparando</span>
                            </div>
                            <div className={`flex-1 h-1 mx-2 ${['shipped', 'delivered'].includes(order.status) ? 'bg-purple-500' : 'bg-muted'}`} />
                            <div className={`flex flex-col items-center ${['shipped', 'delivered'].includes(order.status) ? 'text-purple-600' : 'text-muted-foreground'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${['shipped', 'delivered'].includes(order.status) ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-muted'}`}>
                                    <Truck className="h-5 w-5" />
                                </div>
                                <span className="text-xs mt-2">Enviado</span>
                            </div>
                            <div className={`flex-1 h-1 mx-2 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-muted'}`} />
                            <div className={`flex flex-col items-center ${order.status === 'delivered' ? 'text-green-600' : 'text-muted-foreground'}`}>
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${order.status === 'delivered' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <span className="text-xs mt-2">Entregado</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Shipping Info */}
            {order.status === 'shipped' && order.shipping_tracking && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <Truck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            <div>
                                <h3 className="font-semibold text-purple-800 dark:text-purple-200">Tu pedido está en camino</h3>
                                <p className="text-sm text-purple-600 dark:text-purple-300">
                                    Empresa: {order.shipping_carrier} | Guía: <span className="font-mono">{order.shipping_tracking}</span>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Products */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" />
                        Productos ({order.items?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex gap-4 items-center">
                                <div className="h-16 w-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                                    {item.products?.image_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={item.products.image_url} alt={item.products.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">{item.products?.name || 'Producto'}</p>
                                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-foreground">${(item.quantity * item.unit_price).toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">${item.unit_price} c/u</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-xl font-bold text-primary">${order.total_amount?.toFixed(2)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="h-5 w-5 text-primary" />
                        Dirección de Envío
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{address.fullname}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{address.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground">{address.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="text-foreground">
                            <p>{address.address}</p>
                            <p>{address.city}, {address.state}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
