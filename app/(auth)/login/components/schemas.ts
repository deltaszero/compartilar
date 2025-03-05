import { z } from "zod";

// Login form schema
export const loginSchema = z.object({
    email: z.string().email("Digite um email válido"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

// Signup form schema
export const signupSchema = z.object({
    email: z.string().email("Digite um email válido"),
    username: z
        .string()
        .min(3, "O nome de usuário deve ter no mínimo 3 caracteres")
        .max(20, "O nome de usuário deve ter no máximo 20 caracteres")
        .regex(/^[a-zA-Z0-9_-]+$/, "Use apenas letras, números, _ ou -")
        .toLowerCase(),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;