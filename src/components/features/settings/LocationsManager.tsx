'use client'

import { useState } from 'react'
import { Branch, Warehouse } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, MapPin, Package } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBranchAction, createWarehouseAction, deleteBranchAction, deleteWarehouseAction } from '@/lib/actions/locations'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface LocationsManagerProps {
    branches: Branch[]
    warehouses: any[] // Using any to avoid strict type relation issues for now, or define WarehouseWithBranch
}

export default function LocationsManager({ branches, warehouses }: LocationsManagerProps) {
    const [isBranchOpen, setIsBranchOpen] = useState(false)
    const [isWarehouseOpen, setIsWarehouseOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleAddBranch(formData: FormData) {
        setLoading(true)
        const name = formData.get('name') as string
        const address = formData.get('address') as string

        const res = await createBranchAction({ name, address })
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Sucursal creada' })
            setIsBranchOpen(false)
        }
    }

    async function handleAddWarehouse(formData: FormData) {
        setLoading(true)
        const name = formData.get('name') as string
        const branchId = formData.get('branch_id') as string

        const res = await createWarehouseAction({ name, branch_id: branchId })
        setLoading(false)

        if (res.error) {
            toast({ title: 'Error', description: res.error, variant: 'destructive' })
        } else {
            toast({ title: 'Bodega creada' })
            setIsWarehouseOpen(false)
        }
    }

    async function handleDeleteBranch(id: string) {
        if (!confirm('¿Seguro que deseas eliminar esta sucursal?')) return
        const res = await deleteBranchAction(id)
        if (res.error) toast({ title: 'Error', description: res.error, variant: 'destructive' })
        else toast({ title: 'Sucursal eliminada' })
    }

    async function handleDeleteWarehouse(id: string) {
        if (!confirm('¿Seguro que deseas eliminar esta bodega?')) return
        const res = await deleteWarehouseAction(id)
        if (res.error) toast({ title: 'Error', description: res.error, variant: 'destructive' })
        else toast({ title: 'Bodega eliminada' })
    }

    return (
        <div className="space-y-8">
            {/* BRANCHES SECTION */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Sucursales / Sedes</CardTitle>
                        <CardDescription>Gestiona las ubicaciones físicas de tu taller.</CardDescription>
                    </div>
                    <Dialog open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> Nueva Sede</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Nueva Sede</DialogTitle>
                                <DialogDescription>Añade una nueva ubicación para operaciones.</DialogDescription>
                            </DialogHeader>
                            <form action={handleAddBranch} className="space-y-4">
                                <div>
                                    <Label>Nombre de la Sede</Label>
                                    <Input name="name" placeholder="Ej: Sede Norte" required />
                                </div>
                                <div>
                                    <Label>Dirección</Label>
                                    <Input name="address" placeholder="Ej: Av. Principal 123" />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>Crear Sede</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {branches.map(branch => (
                            <div key={branch.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold flex items-center gap-2">
                                            {branch.name}
                                            {branch.is_main && <Badge variant="secondary" className="text-xs">Principal</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">{branch.address || 'Sin dirección'}</p>
                                    </div>
                                </div>
                                {!branch.is_main && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBranch(branch.id)}>
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* WAREHOUSES SECTION */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Bodegas</CardTitle>
                        <CardDescription>Lugares donde almacenas inventario.</CardDescription>
                    </div>
                    <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Plus className="w-4 h-4 mr-2" /> Nueva Bodega</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Crear Nueva Bodega</DialogTitle>
                            </DialogHeader>
                            <form action={handleAddWarehouse} className="space-y-4">
                                <div>
                                    <Label>Nombre</Label>
                                    <Input name="name" placeholder="Ej: Bodega Repuestos" required />
                                </div>
                                <div>
                                    <Label>Asociada a Sede</Label>
                                    <Select name="branch_id">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar Sede" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                            <SelectItem value="">(Sin asignar / Global)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={loading}>Crear Bodega</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {warehouses.map(wh => (
                            <div key={wh.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-full text-purple-500">
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{wh.name}</div>
                                        <p className="text-sm text-muted-foreground">{wh.branch?.name || 'Global'}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteWarehouse(wh.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
