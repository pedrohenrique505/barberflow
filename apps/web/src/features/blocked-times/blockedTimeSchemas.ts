import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const blockedTimeFormSchema = z
  .object({
    barberId: z.string(),
    date: z.string().min(1, "Informe a data."),
    endTime: z
      .string()
      .min(1, "Informe o horário de fim.")
      .regex(timeRegex, "Informe o horário de fim."),
    reason: z.string(),
    startTime: z
      .string()
      .min(1, "Informe o horário de início.")
      .regex(timeRegex, "Informe o horário de início."),
  })
  .superRefine((blockedTime, context) => {
    if (
      timeRegex.test(blockedTime.startTime) &&
      timeRegex.test(blockedTime.endTime) &&
      timeToMinutes(blockedTime.endTime) <= timeToMinutes(blockedTime.startTime)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O horário de fim deve ser maior que o horário de início.",
        path: ["endTime"],
      });
    }
  });

export type BlockedTimeFormData = z.infer<typeof blockedTimeFormSchema>;

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");

  return Number(hours) * 60 + Number(minutes);
}
