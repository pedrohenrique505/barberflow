import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const availabilityQuerySchema = z
  .object({
    barbershopSlug: z.string().trim().min(1, "Slug da barbearia é obrigatório."),
    serviceId: z.string().trim().min(1, "Serviço é obrigatório."),
    barberId: z.string().trim().min(1, "Barbeiro é obrigatório."),
    date: z
      .string()
      .trim()
      .regex(dateRegex, "Data deve estar no formato YYYY-MM-DD."),
  })
  .superRefine((query, context) => {
    const date = new Date(`${query.date}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      query.date !== date.toISOString().slice(0, 10)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data inválida.",
        path: ["date"],
      });
    }
  });

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
