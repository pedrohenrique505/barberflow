import type { FastifyInstance } from "fastify";

import { availabilityQuerySchema } from "./availability.schemas.js";
import {
  AvailabilityError,
  getAvailability,
} from "./availability.service.js";

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
    throw new AvailabilityError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function availabilityRoutes(app: FastifyInstance) {
  app.get("/availability", async (request) => {
    const query = parseData(availabilityQuerySchema, request.query);

    return getAvailability(query);
  });
}
