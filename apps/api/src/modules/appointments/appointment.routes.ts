import type { FastifyInstance } from "fastify";

import {
  appointmentIdParamsSchema,
  createPublicAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentStatusSchema,
} from "./appointment.schemas.js";
import {
  AppointmentError,
  createPublicAppointment,
  listAppointments,
  updateAppointmentStatus,
} from "./appointment.service.js";

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
    throw new AppointmentError(
      result.error.errors[0]?.message ?? "Dados inválidos.",
      400,
    );
  }

  return result.data;
}

export async function appointmentRoutes(app: FastifyInstance) {
  app.post("/appointments", async (request, reply) => {
    const input = parseData(createPublicAppointmentSchema, request.body);
    const appointment = await createPublicAppointment(input);

    return reply.code(201).send(appointment);
  });

  app.get(
    "/appointments",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const query = parseData(listAppointmentsQuerySchema, request.query);

      return listAppointments(request.user.sub, query);
    },
  );

  app.patch(
    "/appointments/:id/status",
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = parseData(appointmentIdParamsSchema, request.params);
      const input = parseData(updateAppointmentStatusSchema, request.body);

      return updateAppointmentStatus(request.user.sub, id, input);
    },
  );
}
