'use client'

import { Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteCustomerAction } from '@/lib/actions/customers'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function DeleteCustomerButton({ id, name }: { id: string, name: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de eliminar a ${name}? Se borrará la conexión y el registro local.`)) return

        setLoading(true)
        const result = await deleteCustomerAction(id)
        setLoading(false)

        if (result.success) {
            toast.success('Cliente eliminado')
            router.refresh()
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
