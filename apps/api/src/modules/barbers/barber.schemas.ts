import { z } from "zod";

export const createBarberSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  phone: z.string().trim().optional(),
});

export const updateBarberSchema = createBarberSchema.extend({
  isActive: z.boolean({ invalid_type_error: "Status inválido." }),
});

export const barberIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Barbeiro não encontrado."),
});

export const publicBarbersParamsSchema = z.object({
  slug: z.string().trim().min(1, "Slug obrigatório."),
});

export type CreateBarberInput = z.infer<typeof createBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
export type BarberIdParams = z.infer<typeof barberIdParamsSchema>;
export type PublicBarbersParams = z.infer<typeof publicBarbersParamsSchema>;
