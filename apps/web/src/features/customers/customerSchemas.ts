import { z } from "zod";

import { isValidPhone, PHONE_VALIDATION_MESSAGE } from "../../lib/phone";

export const customerFormSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório."),
  phone: z
    .string()
    .trim()
    .min(1, "Telefone obrigatório.")
    .refine(isValidPhone, PHONE_VALIDATION_MESSAGE),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;
