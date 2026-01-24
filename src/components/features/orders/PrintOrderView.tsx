'use client'

import { MapPin, Phone, Mail, Printer } from 'lucide-react'
import OrderQRCode from './OrderQRCode'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function PrintOrderView({ order }: { order: any }) {

    // Auto-print when page loads (optional, but convenient)
    useEffect(() => {
        // Short delay to ensure rendering
        const timer = setTimeout(() => {
            window.print()
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    // ...

    const tenant = order.tenants
    const customer = order.customers
    const asset = order.customer_assets
    const supabase = createClient()

    // Helper for Logo URL
    const getLogoUrl = (path: string | null) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return supabase.storage.from('branding').getPublicUrl(path).data.publicUrl
    }
    const tenantLogo = getLogoUrl(tenant?.logo_url)

    // Public tracking URL
    const trackingUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/track/${order.id}`
        : `/track/${order.id}`

    return (
        <div className="bg-white min-h-screen text-slate-900 p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">
            {/* ... */}

            {/* Header */}
            <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
                <div className="flex gap-6 items-center">
                    {/* Logo Section */}
                    {tenantLogo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={tenantLogo} alt="Logo" className="w-20 h-20 object-contain" />
                    )}

                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-tight">{tenant?.name || 'TechLife Service'}</h1>
                        <div className="mt-2 text-sm text-slate-600 space-y-1">
                            <p className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {tenant?.address || 'Dirección no registrada'}
                                {tenant?.city ? `, ${tenant.city}` : ''}
                            </p>
                            {(tenant?.contact_phone || tenant?.settings?.phone) && (
                                <p className="flex items-center gap-2">
                                    <Phone className="h-3 w-3" />
                                    {tenant?.contact_phone || tenant?.settings?.phone}
                                </p>
                            )}
                            {(tenant?.contact_email || tenant?.settings?.email) && (
                                <p className="flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {tenant?.contact_email || tenant?.settings?.email}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm text-slate-500 uppercase font-semibold">Orden de Servicio</p>
                    <p className="text-4xl font-bold font-mono">#{order.folio_id}</p>
                    <p className="text-xs text-slate-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Client & Asset Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="border border-slate-200 rounded p-4">
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b pb-1">Datos del Cliente</h3>
                    <p className="font-bold text-lg">{customer.full_name}</p>
                    <p className="text-sm text-slate-600">{customer.phone}</p>
                    <p className="text-sm text-slate-600">{customer.email}</p>
                    <p className="text-sm text-slate-600">{customer.address}</p>
                </div>
                <div className="border border-slate-200 rounded p-4">
                    <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 border-b pb-1">Datos del Equipo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Identificador</p>
                            <p className="font-bold">{asset.identifier}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase">Modelo/Marca</p>
                            <p className="font-medium">{asset.details?.brand} {asset.details?.model}</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-slate-500 uppercase">Notas del Equipo</p>
                        <p className="text-sm italic text-slate-600">{asset.notes || '---'}</p>
                    </div>
                </div>
            </div>

            {/* Service Details */}
            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase bg-slate-100 p-2 mb-4 border-l-4 border-slate-800">Detalle del Servicio</h3>
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-slate-700">Problema Reportado:</p>
                        <div className="mt-1 p-3 border border-slate-200 rounded bg-slate-50 min-h-[80px]">
                            {order.description_problem}
                        </div>
                    </div>
                    {order.diagnosis_report && (
                        <div>
                            <p className="font-semibold text-slate-700">Diagnóstico Técnico:</p>
                            <div className="mt-1 p-3 border border-slate-200 rounded bg-slate-50 min-h-[80px]">
                                {order.diagnosis_report}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tracking & Legal */}
            <div className="grid grid-cols-3 gap-8 mt-12 items-end">
                <div className="col-span-1 border-t pt-4 text-center">
                    <div className="h-16"></div>
                    <p className="text-xs uppercase font-bold border-t w-32 mx-auto pt-2">Firma Cliente</p>
                    <p className="text-[10px] text-slate-400 mt-1">Acepto términos y condiciones</p>
                </div>

                <div className="col-span-1 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Escanear para Seguimiento</p>
                    <div className="border-2 border-slate-900 p-1 bg-white inline-block">
                        <OrderQRCode url={trackingUrl} />
                    </div>
                </div>

                <div className="col-span-1 border-t pt-4 text-center">
                    <div className="h-16"></div>
                    <p className="text-xs uppercase font-bold border-t w-32 mx-auto pt-2">Firma Taller</p>
                    <p className="text-[10px] text-slate-400 mt-1">Recibido Conforme</p>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[10px] text-slate-400 mt-12 print:fixed print:bottom-4 print:left-0 print:w-full">
                Documento generado el {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()} • TechLife Service
            </div>
        </div>
    )
}
