import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3333),
});

export const env = envSchema.parse(process.env);
