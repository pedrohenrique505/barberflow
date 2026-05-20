import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres."),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Senha obrigatória."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
