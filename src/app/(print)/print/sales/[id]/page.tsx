import { getSalesOrderForPrintAction } from '@/lib/actions/salesHelpers'
import { notFound } from 'next/navigation'
import PrintSalesView from '@/components/features/pos/PrintSalesView'

export default async function PrintSalesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getSalesOrderForPrintAction(id)

    if (!order) return notFound()

    return <PrintSalesView order={order} />
}
