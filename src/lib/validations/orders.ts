import { z } from "zod"

export const orderSchema = z.object({
    customerId: z.string().uuid("Selecciona un cliente"),
    assetId: z.string().uuid("Selecciona un equipo/vehículo"),
    priority: z.enum(["low", "normal", "high", "urgent"]),
    description: z.string().min(10, "Describe el problema con más detalle (mínimo 10 caracteres)"),
    notes: z.string().optional(),
})

export type OrderFormData = z.infer<typeof orderSchema>

export const statusUpdateSchema = z.object({
    orderId: z.string().uuid(),
    status: z.enum(['reception', 'diagnosis', 'approval', 'repair', 'qa', 'ready', 'delivered']),
    notes: z.string().optional()
})
