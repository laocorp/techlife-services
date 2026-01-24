'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, Send, Loader2, X } from 'lucide-react'
import { addCommentAction, uploadEvidenceAction } from '@/lib/actions/events'

export default function AddEventForm({ orderId }: { orderId: string }) {
    const [comment, setComment] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!comment.trim() && !file) return

        setLoading(true)
        try {
            if (file) {
                const formData = new FormData()
                formData.append('orderId', orderId)
                formData.append('file', file)
                await uploadEvidenceAction(formData)
                setFile(null)
            }

            if (comment.trim()) {
                await addCommentAction(orderId, comment)
                setComment('')
            }
        } catch (error) {
            console.error('Error submitting event', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
            <h3 className="text-sm font-medium text-slate-700">Agregar Nota o Evidencia</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                    placeholder="Escribe un comentario..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[80px]"
                />

                {file && (
                    <div className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border border-slate-200">
                        <Paperclip className="h-4 w-4 text-purple-600" />
                        <span className="truncate max-w-[200px]">{file.name}</span>
                        <button type="button" onClick={() => setFile(null)} className="ml-auto hover:bg-slate-200 rounded-full p-1">
                            <X className="h-3 w-3 text-slate-500" />
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-slate-500 hover:text-purple-600"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-4 w-4 mr-2" />
                            Adjuntar
                        </Button>
                    </div>

                    <Button type="submit" disabled={loading || (!comment && !file)}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                        Enviar
                    </Button>
                </div>
            </form>
        </div>
    )
}
