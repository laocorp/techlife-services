import { z } from "zod"

export const customerSchema = z.object({
    fullName: z.string().min(2, "El nombre es requerido"),
    taxId: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    createAccount: z.boolean().optional(),
    password: z.string().optional()
}).refine((data) => {
    if (data.createAccount) {
        return !!data.email && data.email.length > 0;
    }
    return true;
}, {
    message: "El email es requerido para crear una cuenta",
    path: ["email"]
}).refine((data) => {
    if (data.createAccount) {
        return !!data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: "La contraseña debe tener al menos 6 caracteres",
    path: ["password"]
})

export type CustomerFormData = z.infer<typeof customerSchema>
