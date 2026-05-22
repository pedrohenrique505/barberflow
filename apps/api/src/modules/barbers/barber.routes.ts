import type { FastifyInstance } from "fastify";

import {
  barberIdParamsSchema,
  createBarberSchema,
  publicBarbersParamsSchema,
  updateBarberSchema,
} from "./barber.schemas.js";
import {
  BarberError,
  createBarber,
  deactivateBarber,
  getBarber,
  listBarbers,
  listPublicBarbersByBarbershopSlug,
  updateBarber,
} from "./barber.service.js";

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
    throw new BarberError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function barberRoutes(app: FastifyInstance) {
  app.post(
    "/barbers",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const input = parseData(createBarberSchema, request.body);
      const barber = await createBarber(request.user.sub, input);

      return reply.code(201).send(barber);
    },
  );

  app.get(
    "/barbers",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return listBarbers(request.user.sub);
    },
  );

  app.get(
    "/barbers/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(barberIdParamsSchema, request.params);

      return getBarber(request.user.sub, id);
    },
  );

  app.put(
    "/barbers/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(barberIdParamsSchema, request.params);
      const input = parseData(updateBarberSchema, request.body);

      return updateBarber(request.user.sub, id, input);
    },
  );

  app.delete(
    "/barbers/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(barberIdParamsSchema, request.params);

      return deactivateBarber(request.user.sub, id);
    },
  );

  app.get("/barbershops/:slug/barbers", async (request) => {
    const { slug } = parseData(publicBarbersParamsSchema, request.params);

    return listPublicBarbersByBarbershopSlug(slug);
  });
}
