export type Tenant = {
    id: string
    name: string
    slug: string
    industry: 'automotive' | 'electronics' | 'machinery'
}

export type UserProfile = {
    id: string
    full_name: string
    role: 'owner' | 'admin' | 'technician' | 'receptionist'
}
