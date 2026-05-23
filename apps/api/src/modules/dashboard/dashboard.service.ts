import { AppointmentStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";

const dashboardAppointmentSelect =
  Prisma.validator<Prisma.AppointmentSelect>()({
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
  });

type DashboardAppointment = Prisma.AppointmentGetPayload<{
  select: typeof dashboardAppointmentSelect;
}>;

export class DashboardError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function getDashboardMetrics(ownerId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const now = new Date();
  const todayStart = getUtcDayStart(now);
  const todayEnd = addDays(todayStart, 1);
  const monthStart = getUtcMonthStart(now);
  const nextMonthStart = addMonths(monthStart, 1);

  const [
    totalServices,
    activeServices,
    totalBarbers,
    activeBarbers,
    totalCustomers,
    totalAppointments,
    scheduledAppointments,
    confirmedAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    todayTotalAppointments,
    todayAppointments,
    upcomingAppointments,
    completedAppointmentsThisMonth,
  ] = await prisma.$transaction([
    prisma.service.count({
      where: {
        barbershopId: barbershop.id,
      },
    }),
    prisma.service.count({
      where: {
        barbershopId: barbershop.id,
        isActive: true,
      },
    }),
    prisma.barber.count({
      where: {
        barbershopId: barbershop.id,
      },
    }),
    prisma.barber.count({
      where: {
        barbershopId: barbershop.id,
        isActive: true,
      },
    }),
    prisma.customer.count({
      where: {
        barbershopId: barbershop.id,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
        status: AppointmentStatus.scheduled,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
        status: AppointmentStatus.confirmed,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
        status: AppointmentStatus.completed,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
        status: AppointmentStatus.cancelled,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
        status: AppointmentStatus.no_show,
      },
    }),
    prisma.appointment.count({
      where: {
        barbershopId: barbershop.id,
        startAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    }),
    prisma.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        status: {
          in: [AppointmentStatus.scheduled, AppointmentStatus.confirmed],
        },
        startAt: {
          gte: now,
          lt: todayEnd,
        },
      },
      orderBy: {
        startAt: "asc",
      },
      select: dashboardAppointmentSelect,
    }),
    prisma.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        status: {
          in: [AppointmentStatus.scheduled, AppointmentStatus.confirmed],
        },
        startAt: {
          gte: now,
        },
      },
      orderBy: {
        startAt: "asc",
      },
      take: 5,
      select: dashboardAppointmentSelect,
    }),
    prisma.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        status: AppointmentStatus.completed,
        startAt: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      select: {
        service: {
          select: {
            priceInCents: true,
          },
        },
      },
    }),
  ]);

  const monthlyRevenueInCents = completedAppointmentsThisMonth.reduce(
    (total, appointment) => total + appointment.service.priceInCents,
    0,
  );

  return {
    summary: {
      totalServices,
      activeServices,
      totalBarbers,
      activeBarbers,
      totalCustomers,
      totalAppointments,
    },
    appointmentsByStatus: {
      scheduled: scheduledAppointments,
      confirmed: confirmedAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      no_show: noShowAppointments,
    },
    today: {
      totalAppointments: todayTotalAppointments,
      appointments: todayAppointments.map(formatDashboardAppointment),
    },
    upcomingAppointments: upcomingAppointments.map(formatDashboardAppointment),
    monthlyRevenueInCents,
  };
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
    throw new DashboardError(
      "Cadastre uma barbearia antes de consultar métricas do dashboard.",
      400,
    );
  }

  return barbershop;
}

function formatDashboardAppointment(appointment: DashboardAppointment) {
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
  };
}

function getUtcDayStart(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getUtcMonthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function addMonths(date: Date, months: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
}
