import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import SalesDashboard from '@/components/features/dashboard/SalesDashboard'
import CashierDashboard from '@/components/features/dashboard/CashierDashboard'
import StoreOrderList from '@/components/features/pos/StoreOrderList'
import { getProductsAction } from '@/lib/actions/inventory'
import { getCustomersAction } from '@/lib/actions/customers'
import { getPendingPaymentOrdersAction } from '@/lib/actions/orders'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

    // Fetch products, customers, pending local orders, and ecommerce history for POS
    const [products, customers, pendingOrders, { data: ecommerceOrders }] = await Promise.all([
        getProductsAction(),
        getCustomersAction(),
        getPendingPaymentOrdersAction(),
        supabase
            .from('ecommerce_orders')
            .select('id, total_amount, status, created_at, payment_status')
            .eq('tenant_id', profile?.tenant_id)
            .order('created_at', { ascending: false })
            .limit(50)
    ])

    return (
        <div className="p-8 max-w-[1800px] mx-auto">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Punto de Venta Integrado</h1>
                    <p className="text-muted-foreground mt-1">
                        Hola <span className="font-semibold text-purple-600">{profile?.full_name}</span>.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="new_sale" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px] mb-6 border bg-muted/20">
                    <TabsTrigger value="new_sale">Nueva Venta</TabsTrigger>
                    <TabsTrigger value="pending" className="relative">
                        Cobros Pendientes
                        {pendingOrders && pendingOrders.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
                                {pendingOrders.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="history">Historial Virtual</TabsTrigger>
                </TabsList>
                
                <TabsContent value="new_sale" className="mt-0">
                    <SalesDashboard products={products} customers={customers} userRole={profile?.role || 'owner'} />
                </TabsContent>
                
                <TabsContent value="pending" className="mt-0">
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <CashierDashboard pendingOrders={pendingOrders} />
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <div className="bg-card border rounded-lg p-6 shadow-sm">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold">Ventas de Tienda Virtual</h2>
                            <p className="text-sm text-muted-foreground">Revisa los pedidos web y ábrelos nuevamente haciendo clic en el ícono del ojo.</p>
                        </div>
                        <StoreOrderList orders={ecommerceOrders || []} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
