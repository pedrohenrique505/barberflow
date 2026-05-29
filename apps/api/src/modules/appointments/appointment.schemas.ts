import { AppointmentStatus } from "@prisma/client";
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

export const createPublicAppointmentSchema = z.object({
  barbershopSlug: z.string().trim().min(1, "Slug da barbearia é obrigatório."),
  serviceId: z.string().trim().min(1, "Serviço é obrigatório."),
  barberId: z.string().trim().min(1, "Barbeiro é obrigatório."),
  startAt: dateTimeSchema("Horário"),
  customerName: z.string().trim().min(1, "Nome do cliente é obrigatório."),
  customerPhone: z.string().trim().min(1, "Telefone do cliente é obrigatório."),
});

export const listAppointmentsQuerySchema = z
  .object({
    status: z.nativeEnum(AppointmentStatus, {
      invalid_type_error: "Status inválido.",
    }).optional(),
    startDate: optionalDateTimeSchema("Data inicial"),
    endDate: optionalDateTimeSchema("Data final"),
    barberId: z
      .string({ invalid_type_error: "Barbeiro inválido." })
      .trim()
      .min(1, "Barbeiro inválido.")
      .optional(),
  })
  .superRefine((query, context) => {
    if (query.startDate && query.endDate && query.endDate <= query.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data final deve ser maior que a data inicial.",
        path: ["endDate"],
      });
    }
  });

export const appointmentIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Agendamento não encontrado."),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus, {
    required_error: "Status é obrigatório.",
    invalid_type_error: "Status inválido.",
  }),
});

export const rescheduleAppointmentSchema = z.object({
  barberId: z.string().trim().min(1, "Barbeiro é obrigatório."),
  startAt: dateTimeSchema("Horário"),
});

export type CreatePublicAppointmentInput = z.infer<
  typeof createPublicAppointmentSchema
>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;
export type AppointmentIdParams = z.infer<typeof appointmentIdParamsSchema>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;
export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;
