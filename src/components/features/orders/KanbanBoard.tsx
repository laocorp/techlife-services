'use client'

import React, { useState, useMemo } from 'react'
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, DragStartEvent, DragEndEvent, DragOverEvent, defaultDropAnimationSideEffects } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { updateOrderStatusAction } from '@/lib/actions/orders'
import { SortableItem } from './SortableItem'
import { toast } from 'sonner'
import { useDroppable } from '@dnd-kit/core'

interface KanbanBoardProps {
    initialOrders: any[]
}

const COLUMNS = [
    { id: 'reception', title: 'Recepción', color: 'bg-slate-100' },
    { id: 'diagnosis', title: 'Diagnóstico', color: 'bg-blue-50' },
    { id: 'approval', title: 'Aprobación', color: 'bg-yellow-50' },
    { id: 'repair', title: 'Reparación', color: 'bg-indigo-50' },
    { id: 'qa', title: 'Calidad', color: 'bg-purple-50' },
    { id: 'ready', title: 'Listo', color: 'bg-green-50' },
    { id: 'delivered', title: 'Entregado', color: 'bg-gray-100' }
]

function DroppableColumn({ id, title, children }: { id: string, title: string, children: React.ReactNode }) {
    const { setNodeRef } = useDroppable({ id })
    return (
        <div ref={setNodeRef} className="flex-1 min-w-[280px] bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-full">
            <div className={`p-3 border-b dark:border-slate-800 font-semibold text-sm text-slate-700 dark:text-slate-200 flex justify-between sticky top-0 bg-white dark:bg-slate-900 rounded-t-xl z-10`}>
                {title}
                <span className="text-slate-400 dark:text-slate-500 font-normal">
                    {React.Children.count(children)}
                </span>
            </div>
            <div className="p-2 flex-1 overflow-y-auto min-h-[150px]">
                {children}
            </div>
        </div>
    )
}

export function KanbanBoard({ initialOrders }: KanbanBoardProps) {
    // Transform initial data
    const [orders, setOrders] = useState(initialOrders.map(o => ({
        ...o,
        customer_name: o.customers?.full_name || 'Cliente',
        asset_identifier: o.customer_assets?.identifier || 'Equipo'
    })))

    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    )

    const columns = useMemo(() => {
        const cols = new Map<string, any[]>()
        COLUMNS.forEach(c => cols.set(c.id, []))
        orders.forEach(o => {
            const list = cols.get(o.status)
            if (list) list.push(o)
        })
        return cols
    }, [orders])

    // Optimistic Update Helpers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeOrder = orders.find(o => o.id === active.id)
        if (!activeOrder) return

        // Drop logic: 'over.id' is either a column ID or another item ID.
        // If sorting within same column, we do nothing for status change, just reorder (visual only for now).
        // If moving to new column, we update status.

        let newStatus = over.id as string

        // If dropped on an item, find that item's column
        const overOrder = orders.find(o => o.id === over.id)
        if (overOrder) {
            newStatus = overOrder.status
        }

        // Validate if real column
        if (!COLUMNS.find(c => c.id === newStatus)) {
            // If dropped on item, we already handled it. If not found, ignore.
            if (!overOrder) return
        }

        if (activeOrder.status === newStatus) return // No status change

        // Optimistic UI Update
        const oldStatus = activeOrder.status
        setOrders(prev => prev.map(o =>
            o.id === active.id ? { ...o, status: newStatus } : o
        ))

        toast.loading('Actualizando estado...', { id: 'status-update' })

        // Server Action
        const res = await updateOrderStatusAction(activeOrder.id, newStatus)

        if (res?.error) {
            // Revert
            setOrders(prev => prev.map(o =>
                o.id === active.id ? { ...o, status: oldStatus } : o
            ))
            toast.error('Error al actualizar', { id: 'status-update' })
        } else {
            toast.success('Estado actualizado', { id: 'status-update' })
        }
    }

    const activeOrder = activeId ? orders.find(o => o.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 overflow-x-auto h-[calc(100vh-220px)] pb-4 items-start">
                {COLUMNS.map(col => (
                    <DroppableColumn key={col.id} id={col.id} title={col.title}>
                        <SortableContext
                            items={columns.get(col.id)!.map(o => o.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {columns.get(col.id)!.map(order => (
                                <SortableItem key={order.id} order={order} />
                            ))}
                        </SortableContext>
                    </DroppableColumn>
                ))}
            </div>

            <DragOverlay>
                {activeOrder ? <SortableItem order={activeOrder} /> : null}
            </DragOverlay>
        </DndContext>
    )
}
