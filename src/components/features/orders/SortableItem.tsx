'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Truck, Phone } from 'lucide-react'
import Link from 'next/link'

interface Order {
    id: string
    folio_id: string
    customer_name: string
    asset_identifier: string
    service_description: string
    status: string
    priority: string
    created_at: string
}

interface SortableItemProps {
    order: Order
}

export function SortableItem({ order }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: order.id, data: { order } })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1
    }

    // Priority Colors
    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            case 'normal': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400'
        }
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 group">
            <Card className="hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-l-4 dark:bg-slate-900 dark:border-slate-800" style={{
                borderLeftColor: order.priority === 'urgent' ? '#ef4444' : order.priority === 'high' ? '#f97316' : '#3b82f6'
            }}>
                <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start">
                        <Badge variant="outline" className="font-mono text-xs">#{order.folio_id}</Badge>
                        <Badge className={`${getPriorityColor(order.priority)} border-0 text-[10px] px-1.5 py-0`}>
                            {order.priority.toUpperCase()}
                        </Badge>
                    </div>

                    <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{order.service_description || 'Sin descripción'}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{order.asset_identifier}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[100px]">{order.customer_name}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <Link href={`/orders/${order.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400 z-10" onClick={(e) => e.stopPropagation()}>
                            Ver
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
