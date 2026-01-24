import { z } from "zod"

// Base schema shared by all
const baseAssetSchema = z.object({
    identifier: z.string().min(1, "El identificador es requerido"), // Placa, IMEI, Serial
    brand: z.string().min(1, "La marca es requerida"),
    model: z.string().min(1, "El modelo es requerido"),
    notes: z.string().optional(),
})

// Specific extensions could be added here if needed, 
// for now we'll use a generic "details" json blob in the UI, 
// but validate the core fields.
export const assetSchema = baseAssetSchema

export type AssetFormData = z.infer<typeof assetSchema> & {
    // Extra dynamic fields we might capture manually
    color?: string
    mileage?: string // Automotriz
    hours?: string // Maquinaria
    serial?: string // Electronics
}
