import fastifyJwt from "@fastify/jwt";
import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../env/index.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
    };
    user: {
      sub: string;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

export const authPlugin = fp(async (app) => {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  app.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({
          message: "Token inválido ou ausente.",
        });
      }
    },
  );
});
