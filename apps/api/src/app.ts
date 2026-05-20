import cors from "@fastify/cors";
import Fastify from "fastify";

import { env } from "./env/index.js";

export function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV !== "test",
  });

  app.register(cors, {
    origin: env.FRONTEND_URL,
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  return app;
}
