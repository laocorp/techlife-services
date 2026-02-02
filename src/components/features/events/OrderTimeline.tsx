'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageSquare, Paperclip, FileText, User } from 'lucide-react'
import { useState } from 'react'

type Event = {
    id: string
    type: 'comment' | 'evidence' | 'status_change' | 'assignment'
    content: string
    created_at: string
    actor?: {
        full_name: string
        role: string
    }
    metadata?: any
}

export default function OrderTimeline({ events }: { events: Event[] }) {
    if (!events || events.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No hay actividad registrada.</div>
    }

    return (
        <div className="space-y-6">
            {events.map((event) => (
                <div key={event.id} className="flex gap-4">
                    <div className="flex-none">
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${event.type === 'comment' ? 'bg-blue-100 text-blue-600' : ''}
                            ${event.type === 'evidence' ? 'bg-purple-100 text-purple-600' : ''}
                            ${event.type === 'status_change' ? 'bg-yellow-100 text-yellow-600' : ''}
                            ${event.type === 'assignment' ? 'bg-gray-100 text-gray-600' : ''}
                        `}>
                            {event.type === 'comment' && <MessageSquare className="h-4 w-4" />}
                            {event.type === 'evidence' && <Paperclip className="h-4 w-4" />}
                            {event.type === 'status_change' && <FileText className="h-4 w-4" />}
                            {event.type === 'assignment' && <User className="h-4 w-4" />}
                        </div>
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">
                                {event.actor?.full_name || 'Sistema'}
                            </p>
                            <span className="text-xs text-slate-500 capitalize">
                                {format(new Date(event.created_at), "d MMM, HH:mm", { locale: es })}
                            </span>
                        </div>

                        <div className="bg-card border border-border p-3 rounded-lg rounded-tl-none shadow-sm text-sm text-foreground">
                            {event.content}

                            {event.type === 'evidence' && event.metadata?.filePath && (
                                <div className="mt-2">
                                    <p className="text-xs text-slate-400 mb-2">{event.metadata.fileName}</p>

                                    {(event as any).signedUrl ? (
                                        <div className="rounded-lg overflow-hidden border border-slate-200 w-full max-w-[200px]">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={(event as any).signedUrl}
                                                alt="Evidencia"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <span className="text-xs bg-slate-200 px-2 py-1 rounded">Archivo adjunto (Privado)</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
