import { getCustomersAction } from '@/lib/actions/customers'
import SalesCartView from '@/components/features/sales/SalesCartView'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
    title: 'Carrito de Venta | TechLife Service',
    description: 'Finalizar orden de venta',
}

export default async function SalesCartPage() {
    const customers = await getCustomersAction()

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    let userRole = ''
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        userRole = profile?.role || ''
    }

    return <SalesCartView customers={customers} userRole={userRole} />
}
