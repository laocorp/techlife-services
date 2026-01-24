'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getOrderEventsAction(orderId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('service_order_events')
        .select(`
            *,
            actor:profiles(full_name, role)
        `)
        .eq('service_order_id', orderId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }

    // Generate Signed URLs for evidence
    const eventsWithUrls = await Promise.all(data.map(async (event) => {
        if (event.type === 'evidence' && event.metadata?.filePath) {
            const { data: signedData } = await supabase
                .storage
                .from('order-evidence')
                .createSignedUrl(event.metadata.filePath, 60 * 60 * 24) // 24 hours

            return {
                ...event,
                signedUrl: signedData?.signedUrl
            }
        }
        return event
    }))

    return eventsWithUrls
}

export async function addCommentAction(orderId: string, content: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return { error: 'Perfil no encontrado' }

    const { error } = await supabase.from('service_order_events').insert({
        tenant_id: profile.tenant_id,
        service_order_id: orderId,
        actor_id: user.id,
        type: 'comment',
        content,
    })

    if (error) return { error: 'Error al guardar comentario' }

    revalidatePath(`/orders/${orderId}`)
    return { success: true }
}

export async function uploadEvidenceAction(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const orderId = formData.get('orderId') as string
    const file = formData.get('file') as File

    if (!orderId || !file) return { error: 'Datos faltantes' }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autorizado' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return { error: 'Perfil no encontrado' }

    // 1. Upload to Storage
    // Path: tenant_id/order_id/timestamp-filename
    const timestamp = Date.now()
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
    const path = `${profile.tenant_id}/${orderId}/${timestamp}-${cleanName}`

    const { data: storageData, error: storageError } = await supabase
        .storage
        .from('order-evidence')
        .upload(path, file)

    if (storageError) {
        console.error('Storage Upload Error:', storageError)
        return { error: 'Error al subir archivo' }
    }

    // 2. Create Event
    // We store the full path or public URL. Since it's private bucket, path is key.
    const { error: dbError } = await supabase.from('service_order_events').insert({
        tenant_id: profile.tenant_id,
        service_order_id: orderId,
        actor_id: user.id,
        type: 'evidence',
        content: 'Subió un archivo',
        metadata: {
            filePath: path,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type
        }
    })

    if (dbError) {
        console.error('DB Event Error:', dbError)
        return { error: 'Error al registrar evidencia' }
    }

    revalidatePath(`/orders/${orderId}`)
    return { success: true }
}
