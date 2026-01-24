import { z } from "zod"

export const registerSchema = z.object({
    fullName: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Email inválido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
    companyName: z.string().min(2, {
        message: "El nombre del taller es requerido.",
    }),
    industry: z.enum(["automotive", "electronics", "machinery"]).refine((val) => val, {
        message: "Selecciona una industria.",
    }),
})

export type RegisterFormData = z.infer<typeof registerSchema>

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "La contraseña es requerida"),
})
