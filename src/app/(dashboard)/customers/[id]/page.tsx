
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Car, Smartphone, Hammer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomerAssetsAction } from '@/lib/actions/assets'

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    console.log('Fetching customer:', id)

    // Fetch Customer & Tenant Info (to know industry)
    // We need the tenant industry to know how to label the "New Asset" button or columns
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*, tenants(*)').eq('id', user?.id!).single()
    const tenantIndustry = profile?.tenants?.industry || 'automotive'

    const { data: customer, error: customerError } = await supabase.from('customers').select('*').eq('id', id).single()

    if (customerError) {
        console.error('Error fetching customer:', customerError)
        return notFound() // Verify if it's 404 or other error
    }

    if (!customer) {
        console.log('Customer not found in DB')
        return notFound()
    }

    const assets = await getCustomerAssetsAction(id, tenantIndustry)

    const getIndustryIcon = () => {
        switch (tenantIndustry) {
            case 'automotive': return <Car className="h-6 w-6 text-slate-400" />
            case 'electronics': return <Smartphone className="h-6 w-6 text-slate-400" />
            case 'machinery': return <Hammer className="h-6 w-6 text-slate-400" />
            default: return <Car className="h-6 w-6" />
        }
    }

    const getIdentifierLabel = () => {
        switch (tenantIndustry) {
            case 'automotive': return 'Placa'
            case 'electronics': return 'IMEI / Serie'
            case 'machinery': return 'Serial / ID'
            default: return 'ID'
        }
    }

    return (
        <div className="p-8">
            <Link href="/customers" className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Clientes
            </Link>

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">{customer.full_name}</h1>
                    <div className="flex gap-4 mt-2 text-slate-500">
                        <span>{customer.email}</span>
                        <span>•</span>
                        <span>{customer.phone}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Editar Cliente</Button>
                    <Link href={`/customers/${id}/assets/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Registrar {tenantIndustry === 'automotive' ? 'Vehículo' : 'Equipo'}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-slate-800">Garaje / Equipos</h2>

                <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium w-12"></th>
                                <th className="px-6 py-4 font-medium">{getIdentifierLabel()}</th>
                                <th className="px-6 py-4 font-medium">Marca / Modelo</th>
                                <th className="px-6 py-4 font-medium">Notas</th>
                                <th className="px-6 py-4 font-medium">Registro</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {assets?.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                        Este cliente no tiene equipos registrados.
                                    </td>
                                </tr>
                            )}
                            {assets?.map((asset: any) => (
                                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        {getIndustryIcon()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{asset.identifier}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {asset.details?.brand} {asset.details?.model}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{asset.notes || '-'}</td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {new Date(asset.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/orders?assetId=${asset.id}`} className="text-indigo-600 cursor-pointer hover:underline">
                                            Historial
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
