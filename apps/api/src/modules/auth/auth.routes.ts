import type { FastifyInstance } from "fastify";

import { loginSchema, registerSchema } from "./auth.schemas.js";
import {
  AuthError,
  getAuthenticatedUser,
  loginUser,
  registerUser,
} from "./auth.service.js";

function parseBody<T>(
  schema: {
    safeParse: (body: unknown) =>
      | { success: true; data: T }
      | { success: false; error: { errors: Array<{ message: string }> } };
  },
  body: unknown,
) {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AuthError(result.error.errors[0]?.message ?? "Dados inválidos.", 400);
  }

  return result.data;
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const input = parseBody(registerSchema, request.body);
    const result = await registerUser(app, input);

    return reply.code(201).send(result);
  });

  app.post("/auth/login", async (request) => {
    const input = parseBody(loginSchema, request.body);

    return loginUser(app, input);
  });

  app.get(
    "/me",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return getAuthenticatedUser(request.user.sub);
    },
  );
}
