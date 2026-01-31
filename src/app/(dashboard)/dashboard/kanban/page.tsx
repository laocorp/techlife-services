import { getOrdersAction } from '@/lib/actions/orders'
import { KanbanBoard } from '@/components/features/orders/KanbanBoard'

export const metadata = {
    title: 'Tablero Kanban de Órdenes | TechLife Service',
}

export default async function KanbanPage() {
    const orders = await getOrdersAction()

    // Filter out very old completed orders? For now, show all but sort by date DESC in action.

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tablero Visual</h2>
                <div className="flex items-center space-x-2">
                    {/* Add Filters later */}
                </div>
            </div>

            <KanbanBoard initialOrders={orders} />
        </div>
    )
}
