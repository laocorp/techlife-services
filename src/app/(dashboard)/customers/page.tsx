import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCustomersAction } from '@/lib/actions/customers'
import EnablePortalButton from '@/components/features/customers/EnablePortalButton'
import DeleteCustomerButton from '@/components/features/customers/DeleteCustomerButton'
import CustomerSearch from '@/components/features/customers/CustomerSearch'
export default async function CustomersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> // Next.js 15+ async searchParams
}) {
    const customers = await getCustomersAction()
    const params = await searchParams
    const showInviteSuccess = params?.success === 'invited'

    return (
        <div className="p-8">
            {showInviteSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                    <span className="font-semibold mr-2">¡Invitación enviada!</span>
                    El usuario recibirá una notificación para conectar.
                </div>
            )}

            <CustomerSearch />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
                    <p className="text-slate-500">Gestión de cartera de clientes</p>
                </div>
                <Link href="/customers/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Cliente
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium">Tax ID / DNI</th>
                            <th className="px-6 py-4 font-medium">Contacto</th>
                            <th className="px-6 py-4 font-medium">Dirección</th>
                            <th className="px-6 py-4 font-medium">Registro</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customers?.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                    No hay clientes registrados aún.
                                </td>
                            </tr>
                        )}
                        {customers?.map((customer) => (
                            <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900">{customer.full_name}</td>
                                <td className="px-6 py-4 text-slate-500">{customer.tax_id || '-'}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    <div className="flex flex-col">
                                        <span>{customer.email}</span>
                                        <span className="text-xs">{customer.phone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">{customer.address || '-'}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(customer.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <DeleteCustomerButton id={customer.id} name={customer.full_name} />
                                    <EnablePortalButton
                                        customerId={customer.id}
                                        email={customer.email}
                                        hasUser={!!customer.user_id}
                                    />
                                    <Link href={`/customers/${customer.id}`} className="text-indigo-600 cursor-pointer hover:underline text-sm font-medium">
                                        Ver
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
