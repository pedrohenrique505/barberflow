import type { FastifyInstance } from "fastify";

import {
  barbershopSlugParamsSchema,
  createBarbershopSchema,
} from "./barbershop.schemas.js";
import {
  BarbershopError,
  createBarbershop,
  getMyBarbershop,
  getPublicBarbershopBySlug,
} from "./barbershop.service.js";

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
    throw new BarbershopError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function barbershopRoutes(app: FastifyInstance) {
  app.post(
    "/barbershops",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const input = parseData(createBarbershopSchema, request.body);
      const barbershop = await createBarbershop(request.user.sub, input);

      return reply.code(201).send(barbershop);
    },
  );

  app.get("/barbershops/:slug", async (request) => {
    const { slug } = parseData(barbershopSlugParamsSchema, request.params);

    return getPublicBarbershopBySlug(slug);
  });

  app.get(
    "/me/barbershop",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return getMyBarbershop(request.user.sub);
    },
  );
}
