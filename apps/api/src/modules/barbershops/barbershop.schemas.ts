import { z } from "zod";

export const createBarbershopSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug obrigatório.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug deve conter apenas letras minúsculas, números e hífens.",
    ),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export const barbershopSlugParamsSchema = z.object({
  slug: z.string().trim().min(1, "Slug obrigatório."),
});

export type CreateBarbershopInput = z.infer<typeof createBarbershopSchema>;
export type UpdateBarbershopInput = CreateBarbershopInput;
export type BarbershopSlugParams = z.infer<typeof barbershopSlugParamsSchema>;
