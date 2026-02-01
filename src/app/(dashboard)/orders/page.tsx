import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getOrdersAction } from '@/lib/actions/orders'


interface OrdersPageProps {
    searchParams: Promise<{ assetId?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const { assetId } = await searchParams
    const orders = await getOrdersAction({ assetId })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Órdenes de Servicio</h1>
                    <p className="text-muted-foreground">Gestiona las reparaciones y servicios.</p>
                </div>
                <Button asChild>
                    <Link href="/orders/new">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Orden
                    </Link>
                </Button>
            </div>

            <div className="border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                        <tr className="text-left">
                            <th className="p-4 font-medium">Folio</th>
                            <th className="p-4 font-medium">Cliente</th>
                            <th className="p-4 font-medium">Equipo</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Prioridad</th>
                            <th className="p-4 font-medium">Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!orders || orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    No hay órdenes registradas.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order: any) => (
                                <tr key={order.id} className="border-b last:border-0 hover:bg-muted group">
                                    <td className="p-4 font-medium">
                                        <Link href={`/orders/${order.id}`} className="hover:underline text-primary">
                                            #{order.folio_id}
                                        </Link>
                                    </td>
                                    <td className="p-4">{order.customers?.full_name || 'N/A'}</td>
                                    <td className="p-4">
                                        <div className="font-medium">
                                            {order.customer_assets?.details?.make || order.customer_assets?.details?.brand} {order.customer_assets?.details?.model}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {order.customer_assets?.identifier}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                            ${order.status === 'reception' ? 'bg-blue-100 text-blue-800' : ''}
                            ${order.status === 'ready' ? 'bg-green-100 text-green-800' : ''}
                            ${order.status === 'delivered' ? 'bg-gray-100 text-gray-800' : ''}
                            ${!['reception', 'ready', 'delivered'].includes(order.status) ? 'bg-yellow-100 text-yellow-800' : ''}
                        `}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 capitalize">{order.priority}</td>
                                    <td className="p-4 text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/orders/${order.id}`}>Ver</Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
