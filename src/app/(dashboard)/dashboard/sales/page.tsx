import { getSalesOrdersAction, updateSalesOrderStatusAction } from '@/lib/actions/sales'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Search, ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react'
import { Input } from '@/components/ui/input'

export default async function SalesDashboardPage() {
    const orders = await getSalesOrdersAction()

    const totalSales = orders.reduce((acc, order) => acc + (order.payment_status === 'paid' ? order.total_amount : 0), 0)
    const pendingOrders = orders.filter(o => o.status === 'new' || o.status === 'pending').length

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Ventas y Pedidos</h1>
                    <p className="text-slate-500">Gestiona las ventas de mostrador y pedidos online.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Ventas Totales (Pagadas)</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalSales.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pedidos Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total Órdenes</CardTitle>
                        <Truck className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Órdenes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">ID / Fecha</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Canal / Método</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Cliente / Destino</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Items</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total</th>
                                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-slate-500">No hay órdenes registradas.</td>
                                    </tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">#{order.id.slice(0, 8)}</div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="flex flex-col gap-1">
                                                    <Badge variant="outline" className="w-fit">
                                                        {order.delivery_method === 'pickup' ? 'Retiro / Mostrador' : 'Envío'}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium text-slate-900">
                                                    {/* Start of complex logic simplified */}
                                                    {order.shipping_address && order.shipping_address.includes(',')
                                                        ? order.shipping_address.split(',')[0]
                                                        : (order.shipping_address || 'Cliente Mostrador')}
                                                </div>
                                                <div className="text-xs text-slate-500 max-w-[200px] truncate">
                                                    {order.contact_phone || '-'}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle">
                                                <div className="text-slate-600 text-xs">
                                                    {order.items?.map((i: any) => `${i.quantity}x ${i.product?.name}`).join(', ').slice(0, 50)}
                                                    {(order.items?.length || 0) > 2 ? '...' : ''}
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle text-right font-bold">
                                                ${order.total_amount.toFixed(2)}
                                            </td>
                                            <td className="p-4 align-middle text-center">
                                                <Badge
                                                    className={
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                                                            order.status === 'new' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                                                                'bg-slate-100 text-slate-800'
                                                    }
                                                >
                                                    {order.status === 'delivered' ? 'Entregado' :
                                                        order.status === 'new' ? 'Nuevo' : order.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
