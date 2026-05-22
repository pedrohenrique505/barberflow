import { z } from "zod";

const dateTimeSchema = (fieldName: string) =>
  z
    .string({
      required_error: `${fieldName} é obrigatório.`,
      invalid_type_error: `${fieldName} inválido.`,
    })
    .datetime(`${fieldName} deve ser uma data ISO válida.`)
    .transform((value) => new Date(value));

const optionalDateTimeSchema = (fieldName: string) =>
  z
    .string({
      invalid_type_error: `${fieldName} inválido.`,
    })
    .datetime(`${fieldName} deve ser uma data ISO válida.`)
    .transform((value) => new Date(value))
    .optional();

const blockedTimeBodySchema = z
  .object({
    barberId: z
      .string({ invalid_type_error: "Barbeiro inválido." })
      .trim()
      .min(1, "Barbeiro inválido.")
      .nullable()
      .optional(),
    startAt: dateTimeSchema("Data inicial"),
    endAt: dateTimeSchema("Data final"),
    reason: z
      .string({ invalid_type_error: "Motivo inválido." })
      .trim()
      .min(1, "Motivo inválido.")
      .nullable()
      .optional(),
  })
  .superRefine((blockedTime, context) => {
    if (blockedTime.endAt <= blockedTime.startAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final deve ser maior que a data inicial.",
        path: ["endAt"],
      });
    }
  });

export const createBlockedTimeSchema = blockedTimeBodySchema;
export const updateBlockedTimeSchema = blockedTimeBodySchema;

export const blockedTimeIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Bloqueio não encontrado."),
});

export const listBlockedTimesQuerySchema = z
  .object({
    barberId: z
      .string({ invalid_type_error: "Barbeiro inválido." })
      .trim()
      .min(1, "Barbeiro inválido.")
      .optional(),
    startDate: optionalDateTimeSchema("Data inicial"),
    endDate: optionalDateTimeSchema("Data final"),
  })
  .superRefine((query, context) => {
    if (
      (query.startDate && !query.endDate) ||
      (!query.startDate && query.endDate)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Informe data inicial e data final para filtrar por período.",
        path: ["startDate"],
      });
    }

    if (query.startDate && query.endDate && query.endDate <= query.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final deve ser maior que a data inicial.",
        path: ["endDate"],
      });
    }
  });

export type CreateBlockedTimeInput = z.infer<typeof createBlockedTimeSchema>;
export type UpdateBlockedTimeInput = z.infer<typeof updateBlockedTimeSchema>;
export type BlockedTimeIdParams = z.infer<typeof blockedTimeIdParamsSchema>;
export type ListBlockedTimesQuery = z.infer<
  typeof listBlockedTimesQuerySchema
>;
