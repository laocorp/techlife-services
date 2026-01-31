'use client'

import { MapPin, Phone, Mail, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export interface PrintSalesProps {
    order: {
        id: string
        created_at: string
        total_amount: number
        status: string
        sales_order_items: {
            quantity: number
            unit_price: number
            total: number
            products: {
                name: string
                sku?: string
            }
        }[]
        tenants: {
            name: string
            logo_url?: string
            address?: string
            city?: string
            contact_phone?: string
            contact_email?: string
            settings?: any
        }
        customers?: {
            full_name: string
            email?: string
            phone?: string
        }
    }
}

export default function PrintSalesView({ order }: PrintSalesProps) {

    // Auto-print
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print()
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    const tenant = order.tenants
    const customer = order.customers
    const supabase = createClient()

    const getLogoUrl = (path: string | undefined) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
    }
    const tenantLogo = getLogoUrl(tenant?.logo_url)

    return (
        <div className="bg-white min-h-screen text-slate-900 p-8 max-w-[210mm] mx-auto print:p-2 print:max-w-none font-mono text-sm">
            {/* Header */}
            <div className="text-center mb-6">
                {tenantLogo && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={tenantLogo} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-2" />
                )}
                <h1 className="text-lg font-bold uppercase">{tenant?.name || 'Ticket de Venta'}</h1>
                <p className="text-xs text-slate-600 max-w-[200px] mx-auto">
                    {tenant?.address} {tenant?.city && `, ${tenant.city}`}
                </p>
                <div className="flex justify-center gap-2 text-xs mt-1">
                    {tenant?.contact_phone && <span>Tel: {tenant.contact_phone}</span>}
                </div>
            </div>

            {/* Info */}
            <div className="border-b-2 border-dashed border-slate-300 pb-2 mb-4">
                <div className="flex justify-between">
                    <span>Folio:</span>
                    <span className="font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span>{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString().slice(0, 5)}</span>
                </div>
                {customer && (
                    <div className="mt-2 text-xs">
                        <p>Cliente: {customer.full_name}</p>
                    </div>
                )}
            </div>

            {/* Items */}
            <table className="w-full text-xs mb-4">
                <thead>
                    <tr className="border-b border-slate-900">
                        <th className="text-left py-1">Cant</th>
                        <th className="text-left py-1">Prod</th>
                        <th className="text-right py-1">Precio</th>
                        <th className="text-right py-1">Total</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-dashed">
                    {order.sales_order_items.map((item, idx) => (
                        <tr key={idx}>
                            <td className="py-1 align-top">{item.quantity}</td>
                            <td className="py-1 align-top">{item.products?.name}</td>
                            <td className="py-1 align-top text-right">${item.unit_price}</td>
                            <td className="py-1 align-top text-right">${(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-slate-900 pt-2 mb-8">
                <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL</span>
                    <span>${order.total_amount.toFixed(2)}</span>
                </div>
                <div className="text-xs text-center mt-2 text-slate-500 uppercase">
                    {order.status === 'delivered' ? 'Pagado y Entregado' : order.status}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs space-y-2">
                <p>¡Gracias por su compra!</p>
                <p className="text-[10px] text-slate-400">Sistema TechLife Service</p>
            </div>
        </div>
    )
}
