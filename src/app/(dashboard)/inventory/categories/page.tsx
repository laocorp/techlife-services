import { getCategoriesAction, deleteCategoryAction } from '@/lib/actions/categories'
import CategoryForm from '@/components/features/inventory/CategoryForm'
import { Folder, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CategoriesPage() {
    const categories = await getCategoriesAction()

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/inventory">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Categorías</h1>
                    <p className="text-slate-500">Gestiona las clasificaciones de tu inventario.</p>
                </div>
                <div className="ml-auto">
                    <CategoryForm />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories && categories.length > 0 ? (
                    categories.map((cat: any) => (
                        <div key={cat.id} className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Folder className="h-5 w-5 text-indigo-500" />
                                    <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                                </div>
                                <CategoryForm
                                    categoryToEdit={cat}
                                    trigger={
                                        <button className="text-xs text-slate-400 hover:text-indigo-600">Editar</button>
                                    }
                                />
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2">
                                {cat.description || 'Sin descripción'}
                            </p>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed">
                        No hay categorías creadas.
                    </div>
                )}
            </div>
        </div>
    )
}
