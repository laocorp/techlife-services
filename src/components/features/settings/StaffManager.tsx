'use client'

import { useState } from 'react'
import { Branch, UserProfile, Role } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, UserCog, Mail, Key, Hash } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createStaffAction, updateStaffRoleAction } from '@/lib/actions/staff'
import { toast } from '@/components/ui/use-toast'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface StaffManagerProps {
    staff: UserProfile[]
    branches: Branch[]
}

const ROLE_LABELS: Record<string, string> = {
    owner: 'Dueño',
    manager: 'Gerente / Admin',
    head_technician: 'Jefe de Taller',
    technician: 'Técnico',
    receptionist: 'Recepcionista',
    warehouse_keeper: 'Bodeguero',
    sales_store: 'Vendedor Tienda',
    sales_field: 'Vendedor Campo',
    cashier: 'Caja'
}

export default function StaffManager({ staff, branches }: StaffManagerProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
    const [selectedRole, setSelectedRole] = useState<Role>('technician')

    async function handleCreate(formData: FormData) {
        setLoading(true)
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const fullName = formData.get('fullName') as string
        const role = formData.get('role') as Role
        const branchId = formData.get('branch_id') as string
        const salesCode = formData.get('salesCode') as string

        const res = await createStaffAction({
            email, password, role, branchId, fullName, salesCode
        })
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Personal Creado', description: 'Todo correcto. Recargando...' })
            setTimeout(() => {
                window.location.reload()
            }, 1500)
        }
    }

    async function handleUpdateRole(formData: FormData) {
        if (!editingUser) return
        setLoading(true)
        const role = formData.get('role') as Role
        const branchId = formData.get('branch_id') as string

        console.log('🔍 CLIENT: Updating staff:', {
            userId: editingUser.id,
            userName: editingUser.full_name,
            currentBranchId: editingUser.branch_id,
            newRole: role,
            newBranchId: branchId,
            branchIdType: typeof branchId,
            branchIdIsNull: branchId === null,
            branchIdIsUndefined: branchId === undefined,
            branchIdIsEmpty: branchId === '',
            allFormData: Object.fromEntries(formData.entries())
        })

        const res = await updateStaffRoleAction(editingUser.id, role, branchId)
        setLoading(false)

        console.log('📊 CLIENT: Update result:', res)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: '✅ Cambios guardados', description: 'Actualizando...' })
            setEditingUser(null)
            setTimeout(() => window.location.reload(), 1000)
        }
    }

    const isSalesRole = (role: string) => role === 'sales_store' || role === 'sales_field'

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Equipo de Trabajo</CardTitle>
                    <CardDescription>Gestiona el acceso y roles de tus colaboradores.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Crear Personal</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Colaborador</DialogTitle>
                            <DialogDescription>Crea un perfil de acceso inmediato.</DialogDescription>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Nombre Completo</Label>
                                    <Input name="fullName" placeholder="Juan Pérez" required />
                                </div>
                                <div>
                                    <Label>Email (Usuario)</Label>
                                    <Input name="email" type="email" placeholder="juan@taller.com" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Contraseña Inicial</Label>
                                    <div className="relative">
                                        <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input name="password" type="password" className="pl-9" placeholder="******" required minLength={6} />
                                    </div>
                                </div>
                                <div>
                                    <Label>Asignar a Sede</Label>
                                    <Select name="branch_id">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sede Principal" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Rol</Label>
                                    <Select name="role" required onValueChange={(val) => setSelectedRole(val as Role)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isSalesRole(selectedRole) && (
                                    <div>
                                        <Label>Código de Vendedor</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input name="salesCode" className="pl-9" placeholder="VEND-01" required />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={loading}>Crear Usuario</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {staff.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={member.avatar_url || undefined} />
                                    <AvatarFallback>{member.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold flex items-center gap-2">
                                        {member.full_name}
                                        {member.role === 'owner' && <Badge variant="default" className="text-[10px]">Dueño</Badge>}
                                        {member.sales_code && <Badge variant="outline" className="text-[10px] font-mono">{member.sales_code}</Badge>}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Mail className="w-3 h-3" />
                                        <span className="font-mono">{member.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="font-medium text-sm">{ROLE_LABELS[member.role] || member.role}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {/* @ts-ignore - branch is joined */}
                                        {member.branch?.name || 'Sin Sede'}
                                    </div>
                                </div>

                                <Dialog open={editingUser?.id === member.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => setEditingUser(member)}>
                                            <UserCog className="w-4 h-4 text-primary" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Editar Personal: {member.full_name}</DialogTitle>
                                        </DialogHeader>
                                        <form action={handleUpdateRole} className="space-y-4">
                                            <div>
                                                <Label>Rol</Label>
                                                <Select key={`role-${member.id}`} name="role" defaultValue={member.role}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label>Sede</Label>
                                                <Select key={`branch-${member.id}`} name="branch_id" defaultValue={member.branch_id || undefined}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar Sede" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map(b => (
                                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <DialogFooter className="gap-2 sm:justify-between">
                                                <DeleteStaffButton userId={member.id} />
                                                <Button type="submit" disabled={loading}>Guardar Cambios</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function DeleteStaffButton({ userId }: { userId: string }) {
    const [loading, setLoading] = useState(false)
    // Wait, component uses toast from import directly?
    // The main component imports toast from '@/components/ui/use-toast'. 
    // I should move this component inside or just use the imported function if allowed (it is clean to use hook usually).
    // The file imports: import { toast } from '@/components/ui/use-toast'.

    // I'll create a separate small component or just inline the button logic if possible.
    // Using a separate component is cleaner for state.

    // I need to import `deleteStaffAction` first.
    // And `Trash2` icon.

    async function handleDelete() {
        if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción es irreversible (o lo desactivará si tiene historia).')) return

        setLoading(true)
        const { deleteStaffAction } = await import('@/lib/actions/staff') // Dynamic import to avoid cycle if any? No, safe here.
        const res = await deleteStaffAction(userId)
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Usuario Eliminado/Desactivado', description: res.message })
            setTimeout(() => window.location.reload(), 1000)
        }
    }

    return (
        <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? 'Procesando...' : 'Eliminar Usuario'}
        </Button>
    )
}
