'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createInventoryMovementAction } from '@/lib/actions/inventory'
import { Loader2, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type StockAdjustmentDialogProps = {
    product: any
    trigger?: React.ReactNode
}

export default function StockAdjustmentDialog({ product, trigger }: StockAdjustmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in')
    const [quantityStr, setQuantityStr] = useState('')
    const [notes, setNotes] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const qty = parseFloat(quantityStr)
            if (isNaN(qty) || qty <= 0) throw new Error('Cantidad inválida')

            // For 'out' movements, the action expects a positive quantity, and the DB trigger subtracts it.
            // For 'in' movements, positive adds.
            // For 'adjustment', we should allow negative numbers if it's a manual correction? 
            // The UI simplifies this: 'Entry' (in), 'Exit' (out). 'Adjustment' might be ambiguous for users here.

            // Let's stick to 'in' (Compra/Devolución) and 'out' (Merma/Uso) for now.

            const result = await createInventoryMovementAction({
                productId: product.id,
                type: type,
                quantity: qty,
                notes: notes
            })

            if ((result as any).error) throw new Error((result as any).error)

            setOpen(false)
            setQuantityStr('')
            setNotes('')
            router.refresh()
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
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <ArrowRightLeft className="h-4 w-4" />
                        <span className="sr-only">Ajustar Stock</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajuste de Stock: {product.name}</DialogTitle>
                    <DialogDescription>
                        Registra una entrada o salida de inventario.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 text-center hover:bg-slate-50 transition-colors ${type === 'in' ? 'border-green-500 bg-green-50 hover:bg-green-50' : 'border-transparent bg-slate-100'}`}
                            onClick={() => setType('in')}
                        >
                            <TrendingUp className={`mx-auto h-6 w-6 mb-2 ${type === 'in' ? 'text-green-600' : 'text-slate-400'}`} />
                            <div className={`font-medium ${type === 'in' ? 'text-green-700' : 'text-slate-600'}`}>Entrada</div>
                        </div>
                        <div
                            className={`cursor-pointer rounded-lg border-2 p-4 text-center hover:bg-slate-50 transition-colors ${type === 'out' ? 'border-red-500 bg-red-50 hover:bg-red-50' : 'border-transparent bg-slate-100'}`}
                            onClick={() => setType('out')}
                        >
                            <TrendingDown className={`mx-auto h-6 w-6 mb-2 ${type === 'out' ? 'text-red-600' : 'text-slate-400'}`} />
                            <div className={`font-medium ${type === 'out' ? 'text-red-700' : 'text-slate-600'}`}>Salida</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={quantityStr}
                            onChange={(e) => {
                                const val = e.target.value
                                if (val === '' || /^\d*\.?\d*$/.test(val)) setQuantityStr(val)
                            }}
                            placeholder="0"
                            className="text-lg font-bold"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Motivo / Notas</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={type === 'in' ? "Ej. Compra de proveedores" : "Ej. Producto dañado, Uso interno"}
                        />
                    </div>

                    <div className="flex justify-end gap-2 text-white">
                        {/* Text white added to ensure visibility if button variants have issues, but shadcn buttons usually fine */}
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading} className={type === 'in' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {type === 'in' ? 'Registrar Entrada' : 'Registrar Salida'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
