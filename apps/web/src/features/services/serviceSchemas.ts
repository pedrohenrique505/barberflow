import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  description: z.string().trim().optional(),
  price: z
    .number({ invalid_type_error: "Informe um preço válido." })
    .positive("Preço deve ser maior que zero."),
  durationInMinutes: z
    .number({ invalid_type_error: "Informe uma duração válida." })
    .int("Duração deve ser um número inteiro.")
    .positive("Duração deve ser maior que zero."),
  isActive: z.boolean(),
});

export type ServiceFormData = z.infer<typeof serviceFormSchema>;
