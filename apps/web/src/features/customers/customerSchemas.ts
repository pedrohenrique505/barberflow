import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  phone: z
    .string()
    .trim()
    .min(1, "Telefone obrigatório.")
    .min(8, "Telefone deve ter pelo menos 8 caracteres."),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;
