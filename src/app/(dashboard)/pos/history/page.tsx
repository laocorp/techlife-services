import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function PosHistoryPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Fetch POS orders
    const { data: orders, error } = await supabase
        .from('sales_orders')
        .select(`
            id,
            total_amount,
            delivery_method,
            created_at,
            status
        `)
        .eq('delivery_method', 'pickup') // Assuming POS is pickup for now. Better: Add 'channel' column if needed or rely on created_by logic.
        // Actually, sales_orders doesn't have 'channel' in my schema memory from ecommerce_schema.sql.
        // But POS create action sets delivery_method='pickup' and shipping_address='Mostrador'.
        // Let's rely on that or just show all for now.
        // Wait, the migration didn't add channel.
        // Let's filter by delivery_method = 'pickup' as a proxy for POS, or just show all sales.
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('POS History Error:', error)
        return (
            <div className="p-8 text-red-500">
                <h3 className="font-bold">Error cargando historial</h3>
                <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto">
                    {JSON.stringify(error, null, 2)}
                </pre>
            </div>
        )
    }

    // Fetch details for payments to show method if needed? 
    // Or we accept that orders table doesn't have method.
    // For MVP, we show just list of orders. 

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Historial de Ventas POS</h1>
                <Badge variant="outline">Últimas 50 transacciones</Badge>
            </div>

            <div className="bg-white rounded-lg border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID Venta</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10 text-slate-500">
                                    No hay ventas registradas aún.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs">
                                        {order.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(order.created_at), 'dd MMM yyyy HH:mm', { locale: es })}
                                    </TableCell>
                                    <TableCell className="font-bold text-green-600">
                                        ${order.total_amount.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                            {order.status === 'delivered' ? 'Completado' : order.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
