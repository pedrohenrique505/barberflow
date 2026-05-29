import { AppointmentStatus, Weekday } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { AvailabilityQuery } from "./availability.schemas.js";

const weekdaysByDayOfWeek: Record<number, Weekday> = {
  0: Weekday.sunday,
  1: Weekday.monday,
  2: Weekday.tuesday,
  3: Weekday.wednesday,
  4: Weekday.thursday,
  5: Weekday.friday,
  6: Weekday.saturday,
};

type BusyInterval = {
  startAt: Date;
  endAt: Date;
};

export type SchedulingContext = {
  barbershop: {
    id: string;
    name: string;
    slug: string;
  };
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
};

export class AvailabilityError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function getAvailability(query: AvailabilityQuery) {
  const context = await getSchedulingContext({
    barbershopSlug: query.barbershopSlug,
    serviceId: query.serviceId,
    barberId: query.barberId,
  });
  const dayStart = getUtcDayStart(query.date);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const workingHour = await getWorkingHour(context.barbershop.id, dayStart);

  if (!workingHour || workingHour.isClosed) {
    return formatAvailabilityResponse(
      query.date,
      context.service,
      context.barber,
      [],
    );
  }

  const busyIntervals = await findBusyIntervals({
    barbershopId: context.barbershop.id,
    barberId: context.barber.id,
    startAt: dayStart,
    endAt: dayEnd,
  });
  const slots = buildAvailableSlots({
    dayStart,
    opensAtMinute: workingHour.opensAtMinute,
    closesAtMinute: workingHour.closesAtMinute,
    durationInMinutes: context.service.durationMinutes,
    busyIntervals,
  });

  return formatAvailabilityResponse(
    query.date,
    context.service,
    context.barber,
    slots,
  );
}

export async function getSchedulingContext(input: {
  barbershopSlug: string;
  serviceId: string;
  barberId: string;
}) {
  const barbershop = await prisma.barbershop.findUnique({
    where: {
      slug: input.barbershopSlug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!barbershop) {
    throw new AvailabilityError("Barbearia não encontrada.", 404);
  }

  const service = await prisma.service.findFirst({
    where: {
      id: input.serviceId,
      barbershopId: barbershop.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      priceInCents: true,
    },
  });

  if (!service) {
    throw new AvailabilityError("Serviço não encontrado ou inativo.", 404);
  }

  const barber = await prisma.barber.findFirst({
    where: {
      id: input.barberId,
      barbershopId: barbershop.id,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!barber) {
    throw new AvailabilityError("Barbeiro não encontrado ou inativo.", 404);
  }

  return {
    barbershop,
    service,
    barber,
  };
}

export async function ensureSlotIsAvailable(input: {
  barbershopId: string;
  barberId: string;
  startAt: Date;
  durationInMinutes: number;
}) {
  const dayStart = getUtcDayStart(input.startAt.toISOString().slice(0, 10));
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const workingHour = await getWorkingHour(input.barbershopId, dayStart);

  if (!workingHour || workingHour.isClosed) {
    throw new AvailabilityError("Barbearia fechada neste dia.", 400);
  }

  const busyIntervals = await findBusyIntervals({
    barbershopId: input.barbershopId,
    barberId: input.barberId,
    startAt: dayStart,
    endAt: dayEnd,
  });
  const slots = buildAvailableSlots({
    dayStart,
    opensAtMinute: workingHour.opensAtMinute,
    closesAtMinute: workingHour.closesAtMinute,
    durationInMinutes: input.durationInMinutes,
    busyIntervals,
  });
  const selectedSlot = slots.find(
    (slot) => slot.startAt.getTime() === input.startAt.getTime(),
  );

  if (!selectedSlot) {
    throw new AvailabilityError("Horário indisponível.", 409);
  }

  return {
    startAt: input.startAt,
    endAt: selectedSlot.endAt,
  };
}

export async function ensureTimeRangeIsAvailable(input: {
  barbershopId: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
  ignoredAppointmentId?: string;
}) {
  const dayStart = getUtcDayStart(input.startAt.toISOString().slice(0, 10));
  const workingHour = await getWorkingHour(input.barbershopId, dayStart);

  if (!workingHour || workingHour.isClosed) {
    throw new AvailabilityError(
      "Não é possível agendar fora do horário de funcionamento.",
      400,
    );
  }

  const startAtMinute = minutesSinceDayStart(dayStart, input.startAt);
  const endAtMinute = minutesSinceDayStart(dayStart, input.endAt);

  if (
    startAtMinute < workingHour.opensAtMinute ||
    endAtMinute > workingHour.closesAtMinute
  ) {
    throw new AvailabilityError(
      "Não é possível agendar fora do horário de funcionamento.",
      400,
    );
  }

  const blockedTimeConflict = await prisma.blockedTime.findFirst({
    where: {
      barbershopId: input.barbershopId,
      OR: [{ barberId: null }, { barberId: input.barberId }],
      startAt: {
        lt: input.endAt,
      },
      endAt: {
        gt: input.startAt,
      },
    },
    select: {
      id: true,
    },
  });

  if (blockedTimeConflict) {
    throw new AvailabilityError("O horário selecionado não está disponível.", 409);
  }

  const appointmentConflict = await prisma.appointment.findFirst({
    where: {
      id: {
        not: input.ignoredAppointmentId,
      },
      barbershopId: input.barbershopId,
      barberId: input.barberId,
      status: {
        in: [AppointmentStatus.scheduled, AppointmentStatus.confirmed],
      },
      startAt: {
        lt: input.endAt,
      },
      endAt: {
        gt: input.startAt,
      },
    },
    select: {
      id: true,
    },
  });

  if (appointmentConflict) {
    throw new AvailabilityError("Barbeiro indisponível para este horário.", 409);
  }
}

function buildAvailableSlots(input: {
  dayStart: Date;
  opensAtMinute: number;
  closesAtMinute: number;
  durationInMinutes: number;
  busyIntervals: BusyInterval[];
}) {
  const slots: Array<{ startAt: Date; endAt: Date; label: string }> = [];

  for (
    let startMinute = input.opensAtMinute;
    startMinute + input.durationInMinutes <= input.closesAtMinute;
    startMinute += input.durationInMinutes
  ) {
    const startAt = addMinutes(input.dayStart, startMinute);
    const endAt = addMinutes(startAt, input.durationInMinutes);
    const hasConflict = input.busyIntervals.some((busyInterval) =>
      overlaps(startAt, endAt, busyInterval.startAt, busyInterval.endAt),
    );

    if (!hasConflict) {
      slots.push({
        startAt,
        endAt,
        label: minutesToTime(startMinute),
      });
    }
  }

  return slots;
}

function formatAvailabilityResponse(
  date: string,
  service: { id: string; durationMinutes: number },
  barber: { id: string; name: string },
  slots: Array<{ startAt: Date; endAt: Date; label: string }>,
) {
  return {
    date,
    service: {
      id: service.id,
      durationInMinutes: service.durationMinutes,
    },
    barber,
    slots,
  };
}

function overlaps(
  slotStart: Date,
  slotEnd: Date,
  busyStart: Date,
  busyEnd: Date,
) {
  return slotStart < busyEnd && slotEnd > busyStart;
}

function getUtcDayStart(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function minutesSinceDayStart(dayStart: Date, date: Date) {
  return Math.floor((date.getTime() - dayStart.getTime()) / (60 * 1000));
}

async function getWorkingHour(barbershopId: string, dayStart: Date) {
  const weekday = getWeekday(dayStart);

  return prisma.workingHour.findUnique({
    where: {
      barbershopId_weekday: {
        barbershopId,
        weekday,
      },
    },
    select: {
      opensAtMinute: true,
      closesAtMinute: true,
      isClosed: true,
    },
  });
}

async function findBusyIntervals(input: {
  barbershopId: string;
  barberId: string;
  startAt: Date;
  endAt: Date;
}) {
  const [appointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        barbershopId: input.barbershopId,
        barberId: input.barberId,
        status: {
          in: [AppointmentStatus.scheduled, AppointmentStatus.confirmed],
        },
        startAt: {
          lt: input.endAt,
        },
        endAt: {
          gt: input.startAt,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
    prisma.blockedTime.findMany({
      where: {
        barbershopId: input.barbershopId,
        OR: [{ barberId: null }, { barberId: input.barberId }],
        startAt: {
          lt: input.endAt,
        },
        endAt: {
          gt: input.startAt,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
  ]);

  return [...appointments, ...blockedTimes];
}

function getWeekday(date: Date) {
  const weekday = weekdaysByDayOfWeek[date.getUTCDay()];

  if (!weekday) {
    throw new AvailabilityError("Dia da semana inválido.", 400);
  }

  return weekday;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
