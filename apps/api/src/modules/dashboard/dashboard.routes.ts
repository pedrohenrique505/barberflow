import type { FastifyInstance } from "fastify";

import { getDashboardMetrics } from "./dashboard.service.js";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get(
    "/dashboard/metrics",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      return getDashboardMetrics(request.user.sub);
    },
  );
}
