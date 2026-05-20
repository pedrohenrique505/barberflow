import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  description: z.string().trim().optional(),
  priceInCents: z
    .number({ invalid_type_error: "Preço deve ser um número inteiro positivo." })
    .int("Preço deve ser um número inteiro positivo.")
    .positive("Preço deve ser um número inteiro positivo."),
  durationInMinutes: z
    .number({
      invalid_type_error: "Duração deve ser um número inteiro positivo.",
    })
    .int("Duração deve ser um número inteiro positivo.")
    .positive("Duração deve ser um número inteiro positivo."),
});

export const updateServiceSchema = createServiceSchema.extend({
  isActive: z.boolean({ invalid_type_error: "Status inválido." }),
});

export const serviceIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Serviço não encontrado."),
});

export const publicServicesParamsSchema = z.object({
  slug: z.string().trim().min(1, "Slug obrigatório."),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceIdParams = z.infer<typeof serviceIdParamsSchema>;
export type PublicServicesParams = z.infer<typeof publicServicesParamsSchema>;
