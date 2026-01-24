import { getOrderByIdAction } from '@/lib/actions/orders'
import { notFound } from 'next/navigation'
import PrintOrderView from '@/components/features/orders/PrintOrderView'

// This page renders the print view.
// We use a separate client component for the print dialog logic/CSS if needed, 
// or just pure CSS. For print, standard simple HTML is often best.

export default async function PrintOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getOrderByIdAction(id)

    if (!order) return notFound()

    return <PrintOrderView order={order} />
}
