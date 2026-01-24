'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

type Notification = {
    id: string
    title: string
    message: string
    link: string
    is_read: boolean
    created_at: string
}

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const supabase = createClient()

    const fetchNotifications = async () => {
        const { data } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10)

        if (data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    const markAsRead = async (id: string, currentStatus: boolean) => {
        if (currentStatus) return // Already read

        await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    useEffect(() => {
        fetchNotifications()

        // Realtime subscription could go here
        const channel = supabase
            .channel('notifications-changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    // Refresh on new notification
                    fetchNotifications()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const [isOpen, setIsOpen] = useState(false)

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-indigo-600">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b flex justify-between items-center bg-slate-50">
                    <h4 className="font-semibold text-sm">Notificaciones</h4>
                    {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} nuevas</Badge>}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((n) => (
                            <Link
                                key={n.id}
                                href={n.link || '#'}
                                onClick={() => {
                                    markAsRead(n.id, n.is_read)
                                    setIsOpen(false)
                                }}
                                className={`block p-3 border-b last:border-0 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-indigo-50/50' : ''}`}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!n.is_read ? 'bg-indigo-600' : 'bg-transparent'}`} />
                                    <div>
                                        <p className={`text-sm ${!n.is_read ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                            {n.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 text-right">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>No tienes notificaciones</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
