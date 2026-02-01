'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, X } from 'lucide-react'
import { OrderNotificationDialog } from '@/components/features/orders/OrderNotificationDialog'
import { usePathname } from 'next/navigation'

export function FloatingNotification({ tenantId }: { tenantId: string }) {
    const [notifications, setNotifications] = useState<any[]>([])
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const supabase = createClient()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const pathname = usePathname()

    // Setup audio (Commented out until file is available)
    /*
    useEffect(() => {
        audioRef.current = new Audio('/sounds/notification.mp3') 
    }, [])
    */

    useEffect(() => {
        if (!tenantId) return

        const channel = supabase
            .channel('ecommerce-orders-realtime')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ecommerce_orders',
                    filter: `tenant_id=eq.${tenantId}`
                },
                (payload) => {
                    const newOrder = payload.new
                    addNotification(newOrder)
                    // playNotificationSound()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tenantId])

    const addNotification = (order: any) => {
        setNotifications(prev => [order, ...prev])
    }

    const removeNotification = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    /*
    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log('Audio play failed', e))
        }
    }
    */

    // Hide if in public store? Usually dashboard layout wraps dashboard only. 
    // If this component is in DashboardLayout, it won't show in store. Correct.

    return (
        <>
            {/* Bubble Container - Bottom Left (Facebook style usually bottom right or left) */}
            <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2 pointer-events-none">
                {notifications.map((order) => (
                    <div
                        key={order.id}
                        className="pointer-events-auto bg-white rounded-lg shadow-lg border border-indigo-100 p-4 w-72 animate-in slide-in-from-left duration-300 flex items-start gap-3 cursor-pointer hover:bg-indigo-50 transition-colors"
                        onClick={() => {
                            setSelectedOrderId(order.id)
                            removeNotification(order.id)
                        }}
                    >
                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-600">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-900 text-sm">¡Nueva Venta!</h4>
                                <button
                                    onClick={(e) => removeNotification(order.id, e)}
                                    className="text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 mt-1 truncate">
                                {order.shipping_address?.fullname || 'Cliente'} ha realizado un pedido.
                            </p>
                            <p className="text-xs font-semibold text-indigo-600 mt-1">
                                ${order.total_amount?.toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dialog Viewer */}
            {selectedOrderId && (
                <OrderNotificationDialog
                    orderId={selectedOrderId}
                    onClose={() => setSelectedOrderId(null)}
                />
            )}
        </>
    )
}
