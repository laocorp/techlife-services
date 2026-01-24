import { getCustomersAction } from '@/lib/actions/customers'
import NewOrderForm from '@/components/features/orders/NewOrderForm'

export default async function NewOrderPage() {
    const customers = await getCustomersAction()

    // Transform for client component
    const customerList = customers?.map(c => ({
        id: c.id,
        full_name: c.full_name
    })) || []

    return (
        <div className="container mx-auto py-10">
            <NewOrderForm customers={customerList} />
        </div>
    )
}
