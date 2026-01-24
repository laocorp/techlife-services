'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash2, Plus, Minus, CreditCard, Banknote, QrCode } from 'lucide-react'
import { PosCartItem } from '@/lib/actions/pos'

interface PosCartProps {
    items: PosCartItem[]
    onUpdateQuantity: (id: string, delta: number) => void
    onRemove: (id: string) => void
    onCheckout: (method: 'cash' | 'card' | 'qr') => void
    loading?: boolean
}

export default function PosCart({ items, onUpdateQuantity, onRemove, onCheckout, loading }: PosCartProps) {
    const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-xl border-slate-200">
            <div className="p-4 border-b bg-slate-50">
                <h2 className="font-bold text-lg text-slate-800">Orden Actual</h2>
                <div className="text-sm text-slate-500">
                    {items.length} items agregados
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {items.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                <Banknote className="h-8 w-8 text-slate-300" />
                            </div>
                            <p>Carrito vacío</p>
                            <p className="text-xs">Escanea o selecciona productos</p>
                        </div>
                    ) : (
                        items.map(item => (
                            <div key={item.id} className="flex gap-3 bg-white border p-3 rounded-lg shadow-sm">
                                {(item.image_url) && (
                                    <div className="h-12 w-12 rounded bg-slate-100 overflow-hidden shrink-0">
                                        <img src={item.image_url} className="h-full w-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-medium text-slate-900 truncate pr-2">
                                            {item.name}
                                        </h4>
                                        <button
                                            onClick={() => onRemove(item.id)}
                                            className="text-slate-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <div className="flex items-center gap-2 bg-slate-100 rounded-md p-0.5">
                                            <button
                                                className="p-1 hover:bg-white rounded shadow-sm disabled:opacity-50"
                                                onClick={() => onUpdateQuantity(item.id, -1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                                            <button
                                                className="p-1 hover:bg-white rounded shadow-sm"
                                                onClick={() => onUpdateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="font-bold text-slate-900">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 bg-slate-50 border-t space-y-4">
                <div className="flex justify-between items-center text-lg font-bold text-slate-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>

                <PaymentDialog
                    total={total}
                    onConfirm={onCheckout}
                    disabled={items.length === 0 || loading}
                />
            </div>
        </div>
    )
}

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

function PaymentDialog({ total, onConfirm, disabled }: { total: number, onConfirm: (method: 'cash' | 'card' | 'qr', details?: any) => void, disabled: boolean }) {
    const [open, setOpen] = useState(false)
    const [amountPaid, setAmountPaid] = useState('')
    const [reference, setReference] = useState('')
    const [activeTab, setActiveTab] = useState('cash')

    const change = parseFloat(amountPaid) - total
    const isValidCash = !isNaN(parseFloat(amountPaid)) && parseFloat(amountPaid) >= total

    const handleConfirm = () => {
        if (activeTab === 'cash' && !isValidCash) return

        onConfirm(activeTab as any, {
            amountPaid: activeTab === 'cash' ? parseFloat(amountPaid) : total,
            reference: activeTab !== 'cash' ? reference : undefined,
            change: activeTab === 'cash' ? change : 0
        })
        setOpen(false)
        setAmountPaid('')
        setReference('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700" disabled={disabled}>
                    Cobrar ${total.toFixed(2)}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Procesar Pago</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="cash" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="cash">Efectivo</TabsTrigger>
                        <TabsTrigger value="card">Tarjeta</TabsTrigger>
                        <TabsTrigger value="qr">Transferencia</TabsTrigger>
                    </TabsList>

                    <div className="py-6">
                        <div className="text-center mb-6">
                            <span className="text-sm text-slate-500">Monto a Cobrar</span>
                            <div className="text-4xl font-bold text-slate-900">${total.toFixed(2)}</div>
                        </div>

                        <TabsContent value="cash" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Paga con:</Label>
                                <Input
                                    type="number"
                                    className="text-lg"
                                    autoFocus
                                    placeholder="0.00"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                />
                            </div>

                            <div className="p-4 bg-slate-100 rounded-lg flex justify-between items-center">
                                <span className="font-medium text-slate-600">Cambio / Vuelto:</span>
                                <span className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    ${change >= 0 ? change.toFixed(2) : '---'}
                                </span>
                            </div>
                        </TabsContent>

                        <TabsContent value="card" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Número de Referencia / Voucher</Label>
                                <Input
                                    placeholder="Ej. REF-123456"
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="qr" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Referencia de Transferencia</Label>
                                <Input
                                    placeholder="Ej. #009988"
                                    value={reference}
                                    onChange={e => setReference(e.target.value)}
                                />
                            </div>
                        </TabsContent>
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={handleConfirm}
                            disabled={activeTab === 'cash' ? !isValidCash : false}
                        >
                            Confirmar Cobro
                        </Button>
                    </DialogFooter>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
