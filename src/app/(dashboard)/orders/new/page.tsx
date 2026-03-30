import { getCustomersAction } from '@/lib/actions/customers'
import NewOrderForm from '@/components/features/orders/NewOrderForm'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function NewOrderPage() {
    const customers = await getCustomersAction()

    // Transform for client component
    const customerList = customers?.map(c => ({
        id: c.id,
        full_name: c.full_name
    })) || []

    // Fetch Staff for Assignment
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    let technicians: { id: string, full_name: string }[] = []
    let hasHeadTechnician = false

    if (profile?.tenant_id) {
        // We use a simple query instead of full action to just get names and roles
        const { data: staff } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('tenant_id', profile.tenant_id)
            .in('role', ['technician', 'head_technician'])

        if (staff) {
            technicians = staff.map(s => ({ id: s.id, full_name: s.full_name || 'Técnico' }))
            hasHeadTechnician = staff.some(s => s.role === 'head_technician')
        }
    }

    return (
        <div className="container mx-auto py-10">
            <NewOrderForm 
                customers={customerList} 
                technicians={technicians}
                hasHeadTechnician={hasHeadTechnician}
            />
        </div>
    )
}
