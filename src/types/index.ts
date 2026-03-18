export type Tenant = {
    id: string
    name: string
    slug: string
    industry: 'automotive' | 'electronics' | 'machinery'
    logo_url?: string | null
    cover_url?: string | null
}

export type Role = 'owner' | 'manager' | 'head_technician' | 'technician' | 'receptionist' | 'warehouse_keeper' | 'sales_store' | 'sales_field' | 'cashier'

export type UserProfile = {
    id: string
    tenant_id?: string
    branch_id?: string | null
    full_name: string
    email?: string
    avatar_url?: string | null
    role: Role
    sales_code?: string | null
    created_at?: string
}

export type Branch = {
    id: string
    tenant_id: string
    name: string
    address?: string | null
    phone?: string | null
    is_main: boolean
}

export type Warehouse = {
    id: string
    tenant_id: string
    branch_id?: string | null
    name: string
}

export type InventoryStock = {
    id: string
    item_id: string
    warehouse_id: string
    quantity: number
    min_stock: number
    location_in_warehouse?: string | null
}

