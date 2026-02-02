'use client'

import { useState, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { ConsumerOrderDetailsDialog } from '@/components/features/portal/ConsumerOrderDetailsDialog'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
    const supabase = createClient()
    const { toast } = useToast()
    const router = useRouter()

    useEffect(() => {
        fetchNotifications()
        subscribeToNotifications()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.read).length)
        }
    }

    const subscribeToNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const channel = supabase
            .channel('notifications_bell')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newNotification = payload.new
                    setNotifications(prev => [newNotification, ...prev])
                    setUnreadCount(prev => prev + 1)

                    // Show toast
                    toast({
                        title: newNotification.title,
                        description: newNotification.message,
                        duration: 5000,
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id)
    }

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false)
    }

    // Extract order ID from notification link or metadata
    const extractOrderId = (notification: any): string | null => {
        // Check if link contains an order ID (UUID format)
        if (notification.link) {
            const uuidMatch = notification.link.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
            if (uuidMatch) return uuidMatch[0]
        }
        // Check metadata for order_id
        if (notification.metadata?.order_id) {
            return notification.metadata.order_id
        }
        return null
    }

    const handleViewDetail = (notification: any) => {
        markAsRead(notification.id)
        setIsOpen(false)

        // Check if this is an ecommerce order notification
        const orderId = extractOrderId(notification)
        if (orderId && (
            notification.title?.includes('Pago') ||
            notification.title?.includes('Orden') ||
            notification.link?.includes('/portal/')
        )) {
            // Open modal for ecommerce orders
            setSelectedOrderId(orderId)
        } else if (notification.link) {
            // Navigate for other types of notifications
            window.location.href = notification.link
        }
    }

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full border border-white dark:border-slate-800">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 bg-white dark:bg-slate-900 shadow-xl z-50 border-slate-200 dark:border-slate-700" align="end">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notificaciones</h4>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto text-xs text-indigo-600 dark:text-indigo-400 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-700">
                                Marcar todo leído
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="h-[300px]">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                No tienes notificaciones
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${!notification.read ? 'bg-indigo-50/40 dark:bg-indigo-900/20' : ''}`}
                                        onClick={() => !notification.read && markAsRead(notification.id)}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.read ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-transparent'}`} />
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium leading-none text-slate-900 dark:text-slate-100">
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                                    </span>
                                                    {notification.link && (
                                                        <button
                                                            className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:underline"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleViewDetail(notification)
                                                            }}
                                                        >
                                                            Ver detalle
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </PopoverContent>
            </Popover>

            {/* Order Details Modal */}
            <ConsumerOrderDetailsDialog
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
            />
        </>
    )
}
