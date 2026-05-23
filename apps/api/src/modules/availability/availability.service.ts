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

export class AvailabilityError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function getAvailability(query: AvailabilityQuery) {
  const barbershop = await prisma.barbershop.findUnique({
    where: {
      slug: query.barbershopSlug,
    },
    select: {
      id: true,
    },
  });

  if (!barbershop) {
    throw new AvailabilityError("Barbearia não encontrada.", 404);
  }

  const service = await prisma.service.findFirst({
    where: {
      id: query.serviceId,
      barbershopId: barbershop.id,
      isActive: true,
    },
    select: {
      id: true,
      durationMinutes: true,
    },
  });

  if (!service) {
    throw new AvailabilityError("Serviço não encontrado ou inativo.", 404);
  }

  const barber = await prisma.barber.findFirst({
    where: {
      id: query.barberId,
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

  const dayStart = getUtcDayStart(query.date);
  const dayEnd = addMinutes(dayStart, 24 * 60);
  const weekday = getWeekday(dayStart);

  const workingHour = await prisma.workingHour.findUnique({
    where: {
      barbershopId_weekday: {
        barbershopId: barbershop.id,
        weekday,
      },
    },
    select: {
      opensAtMinute: true,
      closesAtMinute: true,
      isClosed: true,
    },
  });

  if (!workingHour || workingHour.isClosed) {
    return formatAvailabilityResponse(query.date, service, barber, []);
  }

  const [appointments, blockedTimes] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        barbershopId: barbershop.id,
        barberId: barber.id,
        status: {
          in: [AppointmentStatus.scheduled, AppointmentStatus.confirmed],
        },
        startAt: {
          lt: dayEnd,
        },
        endAt: {
          gt: dayStart,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
    prisma.blockedTime.findMany({
      where: {
        barbershopId: barbershop.id,
        OR: [{ barberId: null }, { barberId: barber.id }],
        startAt: {
          lt: dayEnd,
        },
        endAt: {
          gt: dayStart,
        },
      },
      select: {
        startAt: true,
        endAt: true,
      },
    }),
  ]);

  const busyIntervals = [...appointments, ...blockedTimes];
  const slots = buildAvailableSlots({
    dayStart,
    opensAtMinute: workingHour.opensAtMinute,
    closesAtMinute: workingHour.closesAtMinute,
    durationInMinutes: service.durationMinutes,
    busyIntervals,
  });

  return formatAvailabilityResponse(query.date, service, barber, slots);
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
