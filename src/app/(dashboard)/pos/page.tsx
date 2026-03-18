import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SalesDashboard from '@/components/features/dashboard/SalesDashboard'
import { getProductsAction } from '@/lib/actions/inventory'
import { getCustomersAction } from '@/lib/actions/customers'

export default async function POSPage() {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, tenants(name), role')
        .eq('id', user.id)
        .single()

    // Fetch products and customers for POS
    const [products, customers] = await Promise.all([
        getProductsAction(),
        getCustomersAction()
    ])

    return (
        <div className="p-8 max-w-[1800px] mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Punto de Venta</h1>
                <p className="text-muted-foreground mt-1">
                    Hola <span className="font-semibold text-purple-600">{profile?.full_name}</span>, registra tus ventas.
                </p>
            </div>
            <SalesDashboard products={products} customers={customers} userRole={profile?.role || 'owner'} />
        </div>
    )
}
