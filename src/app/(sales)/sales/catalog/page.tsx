import { getProductsAction } from '@/lib/actions/inventory'
import SalesCatalogView from '@/components/features/sales/SalesCatalogView'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Catálogo de Ventas | TechLife Service',
    description: 'Portal de ventas para staff',
}

export default async function SalesCatalogPage() {
    // Ideally we filter by warehouse if the user is assigned to one
    // For now, we fetch all tenant products.
    // getProductsAction already handles tenant isolation.

    const productsData = await getProductsAction()

    // Filter out services - sales agents should only see physical products
    // Services (type='service') are for internal use only (repairs, labor, etc.)
    const products = productsData
        .filter((p: any) => p.type !== 'service') // Exclude all services regardless of price
        .map((p: any) => ({
            id: p.id,
            name: p.name,
            sale_price: p.sale_price,
            quantity: p.quantity,
            sku: p.sku,
            image_url: p.images?.[0] || null
        }))

    return <SalesCatalogView products={products} />
}
