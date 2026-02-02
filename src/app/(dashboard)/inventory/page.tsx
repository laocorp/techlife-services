import { getProductsAction } from '@/lib/actions/inventory'
import { getCategoriesAction } from '@/lib/actions/categories'
import ProductForm from '@/components/features/inventory/ProductForm'
import StockAdjustmentDialog from '@/components/features/inventory/StockAdjustmentDialog'
import ProductHistoryDialog from '@/components/features/inventory/ProductHistoryDialog'
import DeleteProductButton from '@/components/features/inventory/DeleteProductButton'
import { Plus, Search, Package, AlertTriangle, Wrench, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q } = await searchParams
    const [products, categories] = await Promise.all([
        getProductsAction(q),
        getCategoriesAction()
    ])

    // Get current user role
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    let userRole = 'technician' // Default safest role

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (profile) userRole = profile.role
    }

    // Role Permissions
    // Owner, Admin, Receptionist can manage stock. Technician can only view or request (not implemented yet).
    const canManageStock = ['owner', 'admin', 'receptionist'].includes(userRole)

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Same header content... */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Inventario</h1>
                    <p className="text-muted-foreground">Gestiona productos, repuestos y servicios.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/inventory/categories">
                        <Button variant="outline">
                            <Folder className="mr-2 h-4 w-4" />
                            Categorías
                        </Button>
                    </Link>
                    {canManageStock && (
                        <ProductForm
                            categories={categories}
                            trigger={
                                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Nuevo Ítem
                                </button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Filters ... */}
            <div className="bg-card p-4 rounded-lg border border-border shadow-sm mb-6">
                <form className="flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="q"
                            placeholder="Buscar por nombre o SKU..."
                            className="pl-9"
                            defaultValue={q}
                        />
                    </div>
                </form>
            </div>

            {/* Product List ... */}
            <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Categoría</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3 text-right">Precio Venta</th>
                            <th className="px-6 py-3 text-center">Stock</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {products && products.length > 0 ? (
                            products.map((item) => (
                                <tr key={item.id} className="hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{item.name}</div>
                                        {item.sku && <div className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="font-normal">
                                            {item.category}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.type === 'service' ? (
                                            <span className="inline-flex items-center text-muted-foreground">
                                                <Wrench className="mr-1 h-3 w-3" /> Servicio
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-muted-foreground">
                                                <Package className="mr-1 h-3 w-3" /> Producto
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">
                                        ${item.sale_price?.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.type === 'service' ? (
                                            <span className="text-muted-foreground">-</span>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <span className={`font-bold ${item.quantity <= (item.min_stock || 0) ? 'text-destructive' : 'text-foreground'}`}>
                                                    {item.quantity}
                                                </span>
                                                {item.quantity <= (item.min_stock || 0) && (
                                                    <span className="flex items-center text-[10px] text-red-600 mt-1">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Bajo Stock
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {item.type === 'product' && (
                                                <>
                                                    {canManageStock && <StockAdjustmentDialog product={item} />}
                                                    <ProductHistoryDialog product={item} />
                                                </>
                                            )}
                                            {canManageStock && (
                                                <ProductForm
                                                    productToEdit={item}
                                                    categories={categories}
                                                    trigger={
                                                        <button className="text-primary hover:text-primary/80 text-sm font-medium ml-2">
                                                            Editar
                                                        </button>
                                                    }
                                                />
                                            )}
                                            {canManageStock && (
                                                <DeleteProductButton productId={item.id} productName={item.name} />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                    No hay ítems registrados. Comienza creando uno nuevo.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
