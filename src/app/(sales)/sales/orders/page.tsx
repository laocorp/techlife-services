import { getAgentOrdersAction } from '@/lib/actions/sales-portal'
import SalesAgentOrdersView from '@/components/features/sales/orders/SalesAgentOrdersView'

export const dynamic = 'force-dynamic'

export default async function SalesOrdersPage() {
    const { orders, stats } = await getAgentOrdersAction()

    return (
        <div className="container mx-auto max-w-6xl py-6">
            <h1 className="text-3xl font-bold mb-6">Mis Ventas</h1>
            <SalesAgentOrdersView orders={orders} stats={stats || { today: 0, month: 0, totalOrders: 0, pendingPayment: 0 }} />
        </div>
    )
}
