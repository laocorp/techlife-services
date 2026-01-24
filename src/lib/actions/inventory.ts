'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function getProductsAction(term?: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    let query = supabase
        .from('products')
        .select('*')
        .order('name')

    if (term) {
        query = query.ilike('name', `%${term}%`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching products:', error)
        throw new Error('Failed to fetch products')
    }

    return data
}

export async function getProductByIdAction(id: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return null
    }

    return data
}

export type ProductFormData = {
    name: string
    description?: string
    sku?: string
    type: 'product' | 'service'
    min_stock: number
    cost_price: number
    sale_price: number
    category: string
    initial_stock?: number // Only for creation
    is_public?: boolean
    public_price?: number
    images?: string[]
}

export async function createProductAction(data: ProductFormData) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get current tenant from Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Usuario sin taller asignado')

    // 1. Create Product
    const productData = {
        tenant_id: profile.tenant_id,
        name: data.name,
        description: data.description,
        sku: data.sku,
        type: data.type,
        min_stock: data.min_stock || 0,
        cost_price: data.cost_price || 0,
        sale_price: data.sale_price || 0,
        category: data.category || 'General',
        quantity: 0, // Will be updated by movement if initial_stock > 0
        is_public: data.is_public || false,
        public_price: data.public_price || null,
        images: data.images || []
    }

    const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

    if (productError) {
        console.error('Error creating product:', productError)
        return { error: productError.message || 'Failed to create product' }
    }

    // 2. If initial stock provided and it's a product, create movement
    if (data.type === 'product' && data.initial_stock && data.initial_stock > 0) {
        const { error: moveError } = await supabase
            .from('inventory_movements')
            .insert({
                tenant_id: profile.tenant_id,
                product_id: newProduct.id,
                type: 'adjustment', // Initial stock is an adjustment
                quantity: data.initial_stock,
                notes: 'Inventario Inicial',
                created_by: user.id
            })

        if (moveError) {
            console.error('Error creating initial stock movement:', moveError)
            // We don't fail the whole request, but log it. 
            // Ideally we would use a transaction (Supabase RPC) for this atomicity, 
            // but for MVP this is acceptable or we could delete the product.
        }
    }

    revalidatePath('/inventory')
    return { success: true, data: newProduct }
}

export async function updateProductAction(id: string, data: Partial<ProductFormData>) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const updateData = {
        name: data.name,
        description: data.description,
        sku: data.sku,
        // types usually don't change, but allowed
        min_stock: data.min_stock,
        cost_price: data.cost_price,
        sale_price: data.sale_price,
        category: data.category,
        is_public: data.is_public,
        public_price: data.public_price,
        images: data.images
    }

    const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)

    if (error) {
        console.error('Error updating product:', error)
        return { error: 'Failed to update product' }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function createInventoryMovementAction(data: {
    productId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    notes?: string
}) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Usuario sin taller asignado')

    // Determine the actual delta quantity for the movement record
    // In our schema: 
    // 'in' -> adds to stock
    // 'out' -> subtracts from stock (but we usually store positive quantity on the record and type determines logic)
    // 'adjustment' -> can be positive or negative

    // However, looking at the triggers in inventory_schema.sql:
    // IF NEW.type = 'in' THEN UPDATE products SET quantity = quantity + NEW.quantity
    // IF NEW.type = 'out' THEN UPDATE products SET quantity = quantity - NEW.quantity
    // IF NEW.type = 'adjustment' THEN UPDATE products SET quantity = quantity + NEW.quantity

    // So for 'in' and 'out', we must send POSITIVE quantities.
    // For 'adjustment', we send the + or - delta.

    const { error } = await supabase
        .from('inventory_movements')
        .insert({
            tenant_id: profile.tenant_id,
            product_id: data.productId,
            type: data.type,
            quantity: data.quantity,
            notes: data.notes,
            created_by: user.id
        })

    if (error) {
        console.error('Error creating movement:', error)
        return { error: error.message }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function getInventoryHistoryAction(productId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // 1. Fetch movements first (Critical Data)
    const { data: movements, error: moveError } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

    if (moveError) {
        console.error('Error fetching history:', moveError)
        return []
    }

    if (!movements || movements.length === 0) return []

    // 2. Extract unique User IDs
    const userIds = Array.from(new Set(movements.map(m => m.created_by).filter(Boolean)))

    // 3. Fetch Profiles manually (Decoration Data)
    let profilesMap: Record<string, any> = {}

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)

        if (profiles) {
            profilesMap = profiles.reduce((acc, profile) => {
                acc[profile.id] = profile
                return acc
            }, {} as Record<string, any>)
        }
    }

    // 4. Combine data
    const combinedData = movements.map(m => ({
        ...m,
        profiles: m.created_by ? profilesMap[m.created_by] : null
    }))

    return combinedData
}

export async function deleteProductAction(productId: string) {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get User Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'No tienes permisos para eliminar productos.' }
    }

    // 2. Delete Product
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

    if (error) {
        console.error('Error deleting product:', error)
        return { error: 'No se pudo eliminar el producto. Verifica que no tenga items asociados en ordenes.' }
    }

    revalidatePath('/inventory')
    return { success: true }
}
