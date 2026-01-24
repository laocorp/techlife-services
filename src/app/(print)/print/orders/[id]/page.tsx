import { getOrderByIdAction } from '@/lib/actions/orders'
import { notFound } from 'next/navigation'
import PrintOrderView from '@/components/features/orders/PrintOrderView'

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getOrderByIdAction(id)

    if (!order) return notFound()

    return <PrintOrderView order={order} />
}
