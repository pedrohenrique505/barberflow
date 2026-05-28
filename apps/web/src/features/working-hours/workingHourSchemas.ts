import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const workingHoursFormSchema = z.object({
  workingHours: z.array(
    z
      .object({
        dayOfWeek: z.number().int().min(0).max(6),
        opensAt: z.string(),
        closesAt: z.string(),
        isOpen: z.boolean(),
      })
      .superRefine((workingHour, context) => {
        if (!workingHour.isOpen) {
          return;
        }

        if (!workingHour.opensAt) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Horário de abertura é obrigatório.",
            path: ["opensAt"],
          });
        } else if (!timeRegex.test(workingHour.opensAt)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe um horário de abertura válido.",
            path: ["opensAt"],
          });
        }

        if (!workingHour.closesAt) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Horário de fechamento é obrigatório.",
            path: ["closesAt"],
          });
        } else if (!timeRegex.test(workingHour.closesAt)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Informe um horário de fechamento válido.",
            path: ["closesAt"],
          });
        }

        if (
          timeRegex.test(workingHour.opensAt) &&
          timeRegex.test(workingHour.closesAt) &&
          timeToMinutes(workingHour.closesAt) <= timeToMinutes(workingHour.opensAt)
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Fechamento deve ser maior que abertura.",
            path: ["closesAt"],
          });
        }
      }),
  ),
});

export type WorkingHoursFormData = z.infer<typeof workingHoursFormSchema>;

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");

  return Number(hours) * 60 + Number(minutes);
}
