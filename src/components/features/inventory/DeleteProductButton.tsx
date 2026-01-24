'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { deleteProductAction } from '@/lib/actions/inventory'

export default function DeleteProductButton({ productId, productName }: { productId: string, productName: string }) {
    const [open, setOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)

    async function handleDelete() {
        setDeleting(true)
        const res = await deleteProductAction(productId)
        if (res?.error) {
            alert(res.error)
            setDeleting(false)
        } else {
            setOpen(false)
            setDeleting(false)
        }
    }

    return (
        <>
            <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                onClick={() => setOpen(true)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar "{productName}"?</DialogTitle>
                        <DialogDescription>
                            Esta acción es irreversible. Se eliminará el producto del inventario.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Eliminando...' : 'Eliminar'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
