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
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useToast } from '@/components/ui/use-toast'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const supabase = createClient()
    const { toast } = useToast()

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

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-indigo-600 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-2 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full border border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50/50">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto text-xs text-indigo-600 px-2 py-1">
                            Marcar todo leído
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">
                            No tienes notificaciones
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 hover:bg-slate-50 transition-colors ${!notification.read ? 'bg-indigo-50/40' : ''}`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.read ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none text-slate-900">
                                                {notification.title}
                                            </p>
                                            <p className="text-sm text-slate-700 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[11px] font-medium text-slate-500">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                                                </span>
                                                {notification.link && (
                                                    <Link
                                                        href={notification.link}
                                                        className="text-[11px] font-bold text-indigo-700 hover:underline"
                                                        onClick={() => setIsOpen(false)} // Close on navigate
                                                    >
                                                        Ver detalle
                                                    </Link>
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
    )
}
