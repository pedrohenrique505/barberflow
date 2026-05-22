import type { FastifyInstance } from "fastify";

import {
  blockedTimeIdParamsSchema,
  createBlockedTimeSchema,
  listBlockedTimesQuerySchema,
  updateBlockedTimeSchema,
} from "./blocked-time.schemas.js";
import {
  BlockedTimeError,
  createBlockedTime,
  deleteBlockedTime,
  getBlockedTime,
  listBlockedTimes,
  updateBlockedTime,
} from "./blocked-time.service.js";

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
    throw new BlockedTimeError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function blockedTimeRoutes(app: FastifyInstance) {
  app.post(
    "/blocked-times",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const input = parseData(createBlockedTimeSchema, request.body);
      const blockedTime = await createBlockedTime(request.user.sub, input);

      return reply.code(201).send(blockedTime);
    },
  );

  app.get(
    "/blocked-times",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const query = parseData(listBlockedTimesQuerySchema, request.query);

      return listBlockedTimes(request.user.sub, query);
    },
  );

  app.get(
    "/blocked-times/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(blockedTimeIdParamsSchema, request.params);

      return getBlockedTime(request.user.sub, id);
    },
  );

  app.put(
    "/blocked-times/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(blockedTimeIdParamsSchema, request.params);
      const input = parseData(updateBlockedTimeSchema, request.body);

      return updateBlockedTime(request.user.sub, id, input);
    },
  );

  app.delete(
    "/blocked-times/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { id } = parseData(blockedTimeIdParamsSchema, request.params);

      await deleteBlockedTime(request.user.sub, id);

      return reply.code(204).send();
    },
  );
}
