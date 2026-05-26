import { z } from "zod";

export const barberFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 8, {
      message: "Telefone deve ter pelo menos 8 caracteres.",
    }),
  isActive: z.boolean(),
});

export type BarberFormData = z.infer<typeof barberFormSchema>;
