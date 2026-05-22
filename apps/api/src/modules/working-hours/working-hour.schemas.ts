import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const workingHourSchema = z
  .object({
    dayOfWeek: z
      .number({ invalid_type_error: "Dia da semana inválido." })
      .int("Dia da semana inválido.")
      .min(0, "Dia da semana deve estar entre 0 e 6.")
      .max(6, "Dia da semana deve estar entre 0 e 6."),
    opensAt: z
      .string({ invalid_type_error: "Horário de abertura inválido." })
      .regex(timeRegex, "Horário de abertura deve estar no formato HH:mm.")
      .nullable(),
    closesAt: z
      .string({ invalid_type_error: "Horário de fechamento inválido." })
      .regex(timeRegex, "Horário de fechamento deve estar no formato HH:mm.")
      .nullable(),
    isOpen: z.boolean({ invalid_type_error: "Status de abertura inválido." }),
  })
  .superRefine((workingHour, context) => {
    if (!workingHour.isOpen) {
      return;
    }

    if (!workingHour.opensAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Horário de abertura é obrigatório quando o dia está aberto.",
        path: ["opensAt"],
      });
    }

    if (!workingHour.closesAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Horário de fechamento é obrigatório quando o dia está aberto.",
        path: ["closesAt"],
      });
    }

    if (
      workingHour.opensAt &&
      workingHour.closesAt &&
      timeToMinutes(workingHour.closesAt) <= timeToMinutes(workingHour.opensAt)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Horário de fechamento deve ser maior que o de abertura.",
        path: ["closesAt"],
      });
    }
  });

export const updateWorkingHoursSchema = z
  .object({
    workingHours: z
      .array(workingHourSchema, {
        invalid_type_error: "Horários de funcionamento inválidos.",
      })
      .min(1, "Informe ao menos um horário de funcionamento."),
  })
  .superRefine((input, context) => {
    const seenDays = new Set<number>();

    input.workingHours.forEach((workingHour, index) => {
      if (seenDays.has(workingHour.dayOfWeek)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Dia da semana duplicado.",
          path: ["workingHours", index, "dayOfWeek"],
        });
      }

      seenDays.add(workingHour.dayOfWeek);
    });
  });

export type UpdateWorkingHoursInput = z.infer<
  typeof updateWorkingHoursSchema
>;

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");

  return Number(hours) * 60 + Number(minutes);
}
