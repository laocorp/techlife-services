'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteOrderAction } from '@/lib/actions/orders'

export default function DeleteOrderButton({ orderId }: { orderId: string }) {
    const [isPending, startTransition] = useTransition()

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar esta orden? Esta acción no se puede deshacer.')) return

        startTransition(async () => {
            const res = await deleteOrderAction(orderId)
            if (res?.error) {
                alert(res.error)
            }
        })
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
            {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="h-4 w-4" />
            )}
        </Button>
    )
}
