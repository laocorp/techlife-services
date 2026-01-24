'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getOrderPaymentsAction, registerPaymentAction } from '@/lib/actions/finance'
import { getOrderItemsAction } from '@/lib/actions/order-items'
import { Badge } from '@/components/ui/badge'
import { DollarSign, CreditCard, Banknote, Calendar, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function OrderPaymentsManager({ orderId }: { orderId: string }) {
    const [payments, setPayments] = useState<any[]>([])
    const [totalCost, setTotalCost] = useState(0)
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form State
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState<'cash' | 'card' | 'transfer' | 'other'>('cash')
    const [notes, setNotes] = useState('')

    useEffect(() => {
        loadData()
    }, [orderId])

    async function loadData() {
        setLoading(true)
        const [itemsData, paymentsData] = await Promise.all([
            getOrderItemsAction(orderId),
            getOrderPaymentsAction(orderId)
        ])

        // Calculate Total Cost
        const cost = (itemsData || []).reduce((sum: number, item: any) => sum + (item.total || 0), 0)
        setTotalCost(cost)
        setPayments(paymentsData || [])
        setLoading(false)
    }

    async function handleRegisterPayment() {
        if (!amount || parseFloat(amount) <= 0) {
            alert('Ingresa un monto válido')
            return
        }

        setSubmitting(true)
        const res = await registerPaymentAction({
            orderId,
            amount: parseFloat(amount),
            method,
            notes
        })

        if (res?.error) {
            alert(res.error)
        } else {
            setIsDialogOpen(false)
            setAmount('')
            setNotes('')
            loadData()
        }
        setSubmitting(false)
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    const balance = totalCost - totalPaid
    const isPaid = balance <= 0 && totalCost > 0

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900 flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600" />
                    Pagos y Caja
                </h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Pago
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                            <DialogDescription>
                                Ingresa el monto recibido del cliente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Monto ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <Label>Método</Label>
                                    <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Efectivo</SelectItem>
                                            <SelectItem value="card">Tarjeta</SelectItem>
                                            <SelectItem value="transfer">Transferencia</SelectItem>
                                            <SelectItem value="other">Otro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Notas (Opcional)</Label>
                                <Input
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ej. Referencia de transferencia..."
                                />
                            </div>
                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm">
                                <span>Deuda Pendiente:</span>
                                <span className="font-bold text-red-600">${balance.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button onClick={handleRegisterPayment} disabled={submitting}>
                                {submitting ? 'Registrando...' : 'Confirmar Pago'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Resume Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border">
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Orden</div>
                    <div className="text-xl font-bold text-slate-900">${totalCost.toFixed(2)}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="text-xs text-green-600 uppercase font-bold">Abonado</div>
                    <div className="text-xl font-bold text-green-700">${totalPaid.toFixed(2)}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                    <div className="text-xs text-red-600 uppercase font-bold">Pendiente</div>
                    <div className="text-xl font-bold text-red-700">${balance.gt(0) ? balance.toFixed(2) : '0.00'}</div>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-left">
                        <tr>
                            <th className="px-4 py-2">Fecha</th>
                            <th className="px-4 py-2">Método</th>
                            <th className="px-4 py-2">Nota</th>
                            <th className="px-4 py-2 text-right">Monto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-4 text-center text-slate-500">No hay pagos registrados.</td>
                            </tr>
                        ) : (
                            payments.map((p) => (
                                <tr key={p.id}>
                                    <td className="px-4 py-2 text-slate-500">
                                        {format(new Date(p.created_at), 'dd/MM/yy HH:mm', { locale: es })}
                                    </td>
                                    <td className="px-4 py-2 capitalize">
                                        {p.method === 'cash' ? 'Efectivo' : p.method === 'card' ? 'Tarjeta' : p.method}
                                    </td>
                                    <td className="px-4 py-2 text-slate-500 truncate max-w-[150px]">{p.notes}</td>
                                    <td className="px-4 py-2 text-right font-medium text-green-600">
                                        +${p.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isPaid && (
                <div className="bg-green-100 text-green-800 p-3 rounded-md text-center font-bold border border-green-300">
                    ¡ORDEN PAGADA COMPLETAMENTE!
                </div>
            )}
        </div>
    )
}

// Helper for Balance calculation display since toFixed might behave oddly with negatives if not handled, 
// though logic above handles it.
// Added a small .gt(0) check replacement naturally in the JSX logic: Math.max(0, balance)
Number.prototype.gt = function (n: number) { return this > n }
declare global { interface Number { gt(n: number): boolean; } }
