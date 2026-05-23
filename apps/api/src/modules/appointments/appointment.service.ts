import { AppointmentStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import {
  ensureSlotIsAvailable,
  getSchedulingContext,
} from "../availability/availability.service.js";
import type {
  CreatePublicAppointmentInput,
  ListAppointmentsQuery,
  UpdateAppointmentStatusInput,
} from "./appointment.schemas.js";

const appointmentSelect = {
  id: true,
  status: true,
  startAt: true,
  endAt: true,
  service: {
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      priceInCents: true,
    },
  },
  barber: {
    select: {
      id: true,
      name: true,
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
    },
  },
  barbershop: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
};

export class AppointmentError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function createPublicAppointment(
  input: CreatePublicAppointmentInput,
) {
  const context = await getSchedulingContext({
    barbershopSlug: input.barbershopSlug,
    serviceId: input.serviceId,
    barberId: input.barberId,
  });
  const { startAt, endAt } = await ensureSlotIsAvailable({
    barbershopId: context.barbershop.id,
    barberId: context.barber.id,
    startAt: input.startAt,
    durationInMinutes: context.service.durationMinutes,
  });

  try {
    const appointment = await prisma.$transaction(
      async (transaction) => {
        const conflictingAppointment = await transaction.appointment.findFirst({
          where: {
            barbershopId: context.barbershop.id,
            barberId: context.barber.id,
            status: {
              in: [AppointmentStatus.scheduled, AppointmentStatus.confirmed],
            },
            startAt: {
              lt: endAt,
            },
            endAt: {
              gt: startAt,
            },
          },
          select: {
            id: true,
          },
        });

        if (conflictingAppointment) {
          throw new AppointmentError("Horário indisponível.", 409);
        }

        const customer = await transaction.customer.upsert({
          where: {
            barbershopId_phone: {
              barbershopId: context.barbershop.id,
              phone: input.customerPhone,
            },
          },
          update: {
            name: input.customerName,
          },
          create: {
            barbershopId: context.barbershop.id,
            name: input.customerName,
            phone: input.customerPhone,
          },
          select: {
            id: true,
          },
        });

        return transaction.appointment.create({
          data: {
            barbershopId: context.barbershop.id,
            barberId: context.barber.id,
            serviceId: context.service.id,
            customerId: customer.id,
            startAt,
            endAt,
            status: AppointmentStatus.scheduled,
          },
          select: appointmentSelect,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return {
      appointment: formatAppointment(appointment),
    };
  } catch (error) {
    if (error instanceof AppointmentError) {
      throw error;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new AppointmentError(
        "Horário indisponível. Tente escolher outro horário.",
        409,
      );
    }

    throw error;
  }
}

export async function listAppointments(
  ownerId: string,
  query: ListAppointmentsQuery,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  const appointments = await prisma.appointment.findMany({
    where: {
      barbershopId: barbershop.id,
      status: query.status,
      barberId: query.barberId,
      startAt: {
        ...(query.startDate ? { gte: query.startDate } : {}),
        ...(query.endDate ? { lte: query.endDate } : {}),
      },
    },
    orderBy: {
      startAt: "asc",
    },
    select: appointmentSelect,
  });

  return appointments.map(formatAppointment);
}

export async function updateAppointmentStatus(
  ownerId: string,
  appointmentId: string,
  input: UpdateAppointmentStatusInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      barbershopId: barbershop.id,
    },
    select: {
      id: true,
    },
  });

  if (!existingAppointment) {
    throw new AppointmentError("Agendamento não encontrado.", 404);
  }

  const appointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: input.status,
    },
    select: appointmentSelect,
  });

  return formatAppointment(appointment);
}

async function getRequiredOwnerBarbershop(ownerId: string) {
  const barbershop = await prisma.barbershop.findUnique({
    where: {
      ownerId,
    },
    select: {
      id: true,
    },
  });

  if (!barbershop) {
    throw new AppointmentError(
      "Cadastre uma barbearia antes de consultar agendamentos.",
      400,
    );
  }

  return barbershop;
}

function formatAppointment(appointment: {
  id: string;
  status: AppointmentStatus;
  startAt: Date;
  endAt: Date;
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceInCents: number;
  };
  barber: {
    id: string;
    name: string;
  };
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  barbershop: {
    id: string;
    name: string;
    slug: string;
  };
}) {
  return {
    id: appointment.id,
    status: appointment.status,
    startAt: appointment.startAt,
    endAt: appointment.endAt,
    service: {
      id: appointment.service.id,
      name: appointment.service.name,
      durationInMinutes: appointment.service.durationMinutes,
      priceInCents: appointment.service.priceInCents,
    },
    barber: appointment.barber,
    customer: appointment.customer,
    barbershop: appointment.barbershop,
  };
}
