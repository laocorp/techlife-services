import { z } from "zod"

export const customerSchema = z.object({
    fullName: z.string().min(2, "El nombre es requerido"),
    taxId: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
})

export type CustomerFormData = z.infer<typeof customerSchema>
