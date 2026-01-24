import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import NewAssetForm from '@/components/features/assets/NewAssetForm'

export default async function NewAssetPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Get Tenant Industry
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('*, tenants(*)').eq('id', user?.id!).single()
    const industry = profile?.tenants?.industry || 'automotive'

    // 2. Get Customer Name for context
    const { data: customer } = await supabase.from('customers').select('full_name').eq('id', id).single()
    if (!customer) return notFound()

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Link href={`/customers/${id}`} className="flex items-center text-slate-500 hover:text-slate-900 mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Cliente
            </Link>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">Nuevo Equipo / Vehículo</h1>
            <p className="text-slate-500 mb-6">Agregando al cliente: <span className="font-semibold text-slate-900">{customer.full_name}</span></p>

            <NewAssetForm customerId={id} industry={industry} />
        </div>
    )
}
