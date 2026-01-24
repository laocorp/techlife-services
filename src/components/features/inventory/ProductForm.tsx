'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createProductAction, updateProductAction, ProductFormData } from '@/lib/actions/inventory'
import { createClient } from '@/lib/supabase/client'
import { Loader2, UploadCloud, X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

type ProductFormProps = {
    productToEdit?: any // If provided, we are in edit mode
    categories?: any[]
    trigger?: React.ReactNode
    onSuccess?: () => void
}

export default function ProductForm({ productToEdit, categories = [], trigger, onSuccess }: ProductFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Form State with separate handling for numbers to allow empty input
    const [formData, setFormData] = useState<Partial<ProductFormData>>({
        name: productToEdit?.name || '',
        description: productToEdit?.description || '',
        sku: productToEdit?.sku || '',
        type: productToEdit?.type || 'product',
        min_stock: productToEdit?.min_stock || 0,
        cost_price: productToEdit?.cost_price || 0,
        sale_price: productToEdit?.sale_price || 0,
        category: productToEdit?.category || 'General',
        initial_stock: 0,
        is_public: productToEdit?.is_public || false,
        public_price: productToEdit?.public_price || 0,
        images: productToEdit?.images || []
    })

    // Local state for inputs to allow empty strings while typing
    const [rawInputs, setRawInputs] = useState({
        cost_price: productToEdit?.cost_price?.toString() || '',
        sale_price: productToEdit?.sale_price?.toString() || '',
        min_stock: productToEdit?.min_stock?.toString() || '',
        initial_stock: '',
        public_price: productToEdit?.public_price?.toString() || ''
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const filePath = `products/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file)

            if (uploadError) {
                throw uploadError
            }

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)

            setFormData(prev => ({
                ...prev,
                images: [...(prev.images || []), publicUrl]
            }))
        } catch (error: any) {
            console.error('Upload failed', error)
            alert('Error al subir imagen: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    const isEdit = !!productToEdit

    const handleNumberChange = (field: keyof typeof rawInputs, value: string) => {
        // Allow empty string or valid number
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setRawInputs(prev => ({ ...prev, [field]: value }))
            // Update formData with parsed value (or 0 if empty) for logic compatibility
            const numValue = parseFloat(value)
            setFormData(prev => ({
                ...prev,
                [field]: isNaN(numValue) ? 0 : numValue
            }))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Validation simple
            if (!formData.name) throw new Error('Nombre es requerido')

            // Ensure numbers are set correctly from raw inputs before submit
            const finalData = {
                ...formData,
                cost_price: parseFloat(rawInputs.cost_price) || 0,
                sale_price: parseFloat(rawInputs.sale_price) || 0,
                min_stock: parseFloat(rawInputs.min_stock) || 0,
                initial_stock: parseFloat(rawInputs.initial_stock) || 0,
                public_price: parseFloat(rawInputs.public_price) || null, // Allow null if 0
            }

            let result
            if (isEdit) {
                result = await updateProductAction(productToEdit.id, finalData)
            } else {
                result = await createProductAction(finalData as ProductFormData)
            }

            if ((result as any).error) {
                throw new Error((result as any).error)
            }

            setOpen(false)
            router.refresh()
            if (onSuccess) onSuccess()

            if (!isEdit) {
                // Reset form
                setFormData({
                    name: '',
                    description: '',
                    sku: '',
                    type: 'product',
                    min_stock: 0,
                    cost_price: 0,
                    sale_price: 0,
                    category: 'General',
                    initial_stock: 0,
                    is_public: false,
                    public_price: 0,
                    images: []
                })
                setRawInputs({
                    cost_price: '',
                    sale_price: '',
                    min_stock: '',
                    initial_stock: '',
                    public_price: ''
                })
            }

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Nuevo Producto</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                {/* ... Header ... */}
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto / Servicio'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Modifica los detalles del ítem.' : 'Registra un nuevo repuesto o servicio en el catálogo.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>}

                    {/* ... Selects ... */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(v: any) => setFormData({ ...formData, type: v })}
                                disabled={isEdit} // Changing type usually not allowed implies logic change
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="product">Producto (Físico/Repuesto)</SelectItem>
                                    <SelectItem value="service">Servicio (Mano de Obra)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => setFormData({ ...formData, category: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General">General</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Nombre del Ítem</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ej. Pantalla iPhone X Original"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalles adicionales..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Imágenes del Producto</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                            {(formData.images || []).map((url, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-slate-100">
                                    <img src={url} alt={`Imagen ${idx + 1}`} className="object-cover w-full h-full" />
                                    <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 hover:bg-red-500 hover:text-white transition-opacity opacity-0 group-hover:opacity-100"
                                        onClick={() => {
                                            const newImages = [...(formData.images || [])]
                                            newImages.splice(idx, 1)
                                            setFormData({ ...formData, images: newImages })
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}

                            <label className="border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-colors aspect-square">
                                {uploading ? (
                                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                                ) : (
                                    <>
                                        <div className="bg-indigo-100 p-2 rounded-full mb-1">
                                            <UploadCloud className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium">Subir Foto</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={handleImageUpload}
                                />
                            </label>
                        </div>
                    </div>

                    {formData.type === 'product' && (
                        <div className="space-y-2">
                            <Label>Código / SKU</Label>
                            <Input
                                value={formData.sku}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Escanear código de barras..."
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Precio Costo ($)</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={rawInputs.cost_price}
                                onChange={e => handleNumberChange('cost_price', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Precio Venta ($)</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={rawInputs.sale_price}
                                onChange={e => handleNumberChange('sale_price', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Stock Section - Only for Products */}
                    {formData.type === 'product' && (
                        <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                            <h4 className="text-sm font-medium text-slate-700">Inventario</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Stock Mínimo (Alerta)</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={rawInputs.min_stock}
                                        onChange={e => handleNumberChange('min_stock', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isEdit ? 'Stock Actual (Solo Lectura)' : 'Stock Inicial'}</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0"
                                        disabled={isEdit}
                                        value={isEdit ? (productToEdit.quantity || 0) : rawInputs.initial_stock}
                                        onChange={e => handleNumberChange('initial_stock', e.target.value)}
                                    />
                                    {isEdit && <span className="text-xs text-muted-foreground">Para ajustar stock, usa Movimientos.</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-indigo-900">Tienda Online</Label>
                                <p className="text-xs text-indigo-600">Hacer visible este producto en el catálogo público.</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_public"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={formData.is_public || false}
                                    onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                                />
                                <Label htmlFor="is_public">Público</Label>
                            </div>
                        </div>

                        {formData.is_public && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                                <Label className="text-indigo-900">Precio Público (Opcional)</Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Dejar vacío para usar Precio Venta normal"
                                    value={rawInputs.public_price}
                                    onChange={e => handleNumberChange('public_price', e.target.value)}
                                    className="border-indigo-200 focus:ring-indigo-500"
                                />
                                <p className="text-xs text-indigo-500">
                                    Si se deja en 0 o vacío, se usará el Precio Venta (${rawInputs.sale_price || '0'}).
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Guardar Cambios' : 'Crear Ítem'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
