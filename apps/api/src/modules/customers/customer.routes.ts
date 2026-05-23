import type { FastifyInstance } from "fastify";

import {
  customerIdParamsSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./customer.schemas.js";
import {
  CustomerError,
  getCustomer,
  listCustomers,
  updateCustomer,
} from "./customer.service.js";

function parseData<T>(
  schema: {
    safeParse: (data: unknown) =>
      | { success: true; data: T }
      | { success: false; error: { errors: Array<{ message: string }> } };
  },
  data: unknown,
) {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new CustomerError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function customerRoutes(app: FastifyInstance) {
  app.get(
    "/customers",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const query = parseData(listCustomersQuerySchema, request.query);

      return listCustomers(request.user.sub, query);
    },
  );

  app.get(
    "/customers/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(customerIdParamsSchema, request.params);

      return getCustomer(request.user.sub, id);
    },
  );

  app.put(
    "/customers/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(customerIdParamsSchema, request.params);
      const input = parseData(updateCustomerSchema, request.body);

      return updateCustomer(request.user.sub, id, input);
    },
  );
}
