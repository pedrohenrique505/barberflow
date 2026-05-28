import { z } from "zod";

export const barbershopFormSchema = z.object({
  name: z.string().trim().min(1, "Nome da barbearia é obrigatório."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug é obrigatório.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug deve conter apenas letras minúsculas, números e hífen.",
    ),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type BarbershopFormData = z.infer<typeof barbershopFormSchema>;
