import type { FastifyInstance } from "fastify";

import {
  createServiceSchema,
  publicServicesParamsSchema,
  serviceIdParamsSchema,
  updateServiceSchema,
} from "./service.schemas.js";
import {
  ServiceError,
  createService,
  deactivateService,
  getService,
  listPublicServicesByBarbershopSlug,
  listServices,
  updateService,
} from "./service.service.js";

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
    throw new ServiceError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function serviceRoutes(app: FastifyInstance) {
  app.post(
    "/services",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const input = parseData(createServiceSchema, request.body);
      const service = await createService(request.user.sub, input);

      return reply.code(201).send(service);
    },
  );

  app.get(
    "/services",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return listServices(request.user.sub);
    },
  );

  app.get(
    "/services/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(serviceIdParamsSchema, request.params);

      return getService(request.user.sub, id);
    },
  );

  app.put(
    "/services/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(serviceIdParamsSchema, request.params);
      const input = parseData(updateServiceSchema, request.body);

      return updateService(request.user.sub, id, input);
    },
  );

  app.delete(
    "/services/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(serviceIdParamsSchema, request.params);

      return deactivateService(request.user.sub, id);
    },
  );

  app.get("/barbershops/:slug/services", async (request) => {
    const { slug } = parseData(publicServicesParamsSchema, request.params);

    return listPublicServicesByBarbershopSlug(slug);
  });
}
