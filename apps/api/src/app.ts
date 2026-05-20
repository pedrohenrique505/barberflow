import cors from "@fastify/cors";
import Fastify from "fastify";
import { ZodError } from "zod";

import { env } from "./env/index.js";
import { prisma } from "./lib/prisma.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { AuthError } from "./modules/auth/auth.service.js";
import { barbershopRoutes } from "./modules/barbershops/barbershop.routes.js";
import { BarbershopError } from "./modules/barbershops/barbershop.service.js";
import { serviceRoutes } from "./modules/services/service.routes.js";
import { ServiceError } from "./modules/services/service.service.js";
import { authPlugin } from "./plugins/auth.js";

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  app.register(authPlugin);
  app.register(authRoutes);
  app.register(barbershopRoutes);
  app.register(serviceRoutes);

  app.setErrorHandler((error, _request, reply) => {
    if (
      error instanceof AuthError ||
      error instanceof BarbershopError ||
      error instanceof ServiceError
    ) {
      return reply.code(error.statusCode).send({
        message: error.message,
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: error.errors[0]?.message ?? "Dados inválidos.",
      });
    }

    app.log.error(error);

    return reply.code(500).send({
      message: "Erro interno do servidor.",
    });
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/health/db", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: "ok",
      database: "connected",
    };
  });

  return app;
}
