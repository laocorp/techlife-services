'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCategoryAction, updateCategoryAction, CategoryFormData } from '@/lib/actions/categories'
import { Loader2, Plus, Pencil } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type CategoryFormProps = {
    categoryToEdit?: any
    trigger?: React.ReactNode
}

export default function CategoryForm({ categoryToEdit, trigger }: CategoryFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [formData, setFormData] = useState<CategoryFormData>({
        name: categoryToEdit?.name || '',
        description: categoryToEdit?.description || ''
    })

    const isEdit = !!categoryToEdit

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (!formData.name) throw new Error('Nombre requerido')

            let result
            if (isEdit) {
                result = await updateCategoryAction(categoryToEdit.id, formData)
            } else {
                result = await createCategoryAction(formData)
            }

            if ((result as any).error) throw new Error((result as any).error)

            setOpen(false)
            router.refresh()

            if (!isEdit) {
                setFormData({ name: '', description: '' })
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" /> Nueva Categoría
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
                    <DialogDescription>Organiza tus productos y servicios.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <div className="space-y-2">
                        <Label>Nombre</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
