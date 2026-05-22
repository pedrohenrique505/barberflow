import type { FastifyInstance } from "fastify";

import { updateWorkingHoursSchema } from "./working-hour.schemas.js";
import {
  WorkingHourError,
  listWorkingHours,
  updateWorkingHours,
} from "./working-hour.service.js";

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
    throw new WorkingHourError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function workingHourRoutes(app: FastifyInstance) {
  app.get(
    "/working-hours",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return listWorkingHours(request.user.sub);
    },
  );

  app.put(
    "/working-hours",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const input = parseData(updateWorkingHoursSchema, request.body);

      return updateWorkingHours(request.user.sub, input);
    },
  );
}
