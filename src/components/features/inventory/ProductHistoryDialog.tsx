'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { History, Loader2, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'
import { getInventoryHistoryAction } from '@/lib/actions/inventory'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type ProductHistoryDialogProps = {
    product: any
    trigger?: React.ReactNode
}

export default function ProductHistoryDialog({ product, trigger }: ProductHistoryDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        if (open) {
            fetchHistory()
        }
    }, [open, product.id])

    async function fetchHistory() {
        setLoading(true)
        try {
            const data = await getInventoryHistoryAction(product.id)
            setHistory(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Ver Historial">
                        <History className="h-4 w-4 text-slate-500" />
                        <span className="sr-only">Historial</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Historial de Movimientos</DialogTitle>
                    <DialogDescription>
                        Producto: <span className="font-medium text-slate-900">{product.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : history.length > 0 ? (
                        <div className="space-y-4">
                            {history.map((move) => (
                                <div key={move.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border bg-slate-50/50 text-sm">
                                    <div className="flex items-center gap-3 min-w-[120px]">
                                        {move.type === 'in' && <div className="p-2 rounded-full bg-green-100 text-green-700"><TrendingUp className="h-4 w-4" /></div>}
                                        {move.type === 'out' && <div className="p-2 rounded-full bg-red-100 text-red-700"><TrendingDown className="h-4 w-4" /></div>}
                                        {move.type === 'adjustment' && <div className="p-2 rounded-full bg-blue-100 text-blue-700"><RefreshCcw className="h-4 w-4" /></div>}

                                        <div>
                                            <div className="font-medium capitalize text-slate-900">
                                                {move.type === 'in' ? 'Entrada' : move.type === 'out' ? 'Salida' : 'Ajuste'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {format(new Date(move.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 border-l pl-3 sm:border-l-0 sm:pl-0 sm:border-l-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold text-slate-700 text-lg">
                                                    {move.type === 'out' ? '-' : '+'}{move.quantity}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-medium text-slate-900">
                                                    {move.profiles?.full_name || 'Desconocido'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">User</div>
                                            </div>
                                        </div>
                                        {move.notes && (
                                            <div className="mt-2 text-slate-600 bg-white p-2 rounded border border-slate-100">
                                                "{move.notes}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            No hay movimientos registrados.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
