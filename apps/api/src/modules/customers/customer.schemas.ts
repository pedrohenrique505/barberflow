import { z } from "zod";

export const listCustomersQuerySchema = z.object({
  search: z
    .string({ invalid_type_error: "Busca inválida." })
    .trim()
    .min(1, "Busca inválida.")
    .optional(),
  phone: z
    .string({ invalid_type_error: "Telefone inválido." })
    .trim()
    .min(1, "Telefone inválido.")
    .optional(),
});

export const customerIdParamsSchema = z.object({
  id: z.string().trim().min(1, "Cliente não encontrado."),
});

export const updateCustomerSchema = z.object({
  name: z.string().trim().min(1, "Nome do cliente é obrigatório."),
  phone: z.string().trim().min(1, "Telefone do cliente é obrigatório."),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;
export type CustomerIdParams = z.infer<typeof customerIdParamsSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
