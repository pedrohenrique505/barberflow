import { Weekday } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { UpdateWorkingHoursInput } from "./working-hour.schemas.js";

const weekdaysByDayOfWeek: Record<number, Weekday> = {
  0: Weekday.sunday,
  1: Weekday.monday,
  2: Weekday.tuesday,
  3: Weekday.wednesday,
  4: Weekday.thursday,
  5: Weekday.friday,
  6: Weekday.saturday,
};

const dayOfWeekByWeekday: Record<Weekday, number> = {
  [Weekday.sunday]: 0,
  [Weekday.monday]: 1,
  [Weekday.tuesday]: 2,
  [Weekday.wednesday]: 3,
  [Weekday.thursday]: 4,
  [Weekday.friday]: 5,
  [Weekday.saturday]: 6,
};

const workingHourSelect = {
  id: true,
  barbershopId: true,
  weekday: true,
  opensAtMinute: true,
  closesAtMinute: true,
  isClosed: true,
  createdAt: true,
  updatedAt: true,
};

export class WorkingHourError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function listWorkingHours(ownerId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const workingHours = await prisma.workingHour.findMany({
    where: {
      barbershopId: barbershop.id,
    },
    select: workingHourSelect,
  });

  return workingHours
    .map(formatWorkingHour)
    .sort((current, next) => current.dayOfWeek - next.dayOfWeek);
}

export async function updateWorkingHours(
  ownerId: string,
  input: UpdateWorkingHoursInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  await prisma.$transaction(
    input.workingHours.map((workingHour) => {
      const weekday = weekdaysByDayOfWeek[workingHour.dayOfWeek];

      if (!weekday) {
        throw new WorkingHourError("Dia da semana inválido.", 400);
      }

      const isClosed = !workingHour.isOpen;
      const opensAtMinute =
        workingHour.isOpen && workingHour.opensAt
          ? timeToMinutes(workingHour.opensAt)
          : 0;
      const closesAtMinute =
        workingHour.isOpen && workingHour.closesAt
          ? timeToMinutes(workingHour.closesAt)
          : 0;

      return prisma.workingHour.upsert({
        where: {
          barbershopId_weekday: {
            barbershopId: barbershop.id,
            weekday,
          },
        },
        create: {
          barbershopId: barbershop.id,
          weekday,
          opensAtMinute,
          closesAtMinute,
          isClosed,
        },
        update: {
          opensAtMinute,
          closesAtMinute,
          isClosed,
        },
      });
    }),
  );

  return listWorkingHours(ownerId);
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
    throw new WorkingHourError(
      "Cadastre uma barbearia antes de configurar os horários.",
      400,
    );
  }

  return barbershop;
}

function formatWorkingHour(workingHour: {
  id: string;
  barbershopId: string;
  weekday: Weekday;
  opensAtMinute: number;
  closesAtMinute: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: workingHour.id,
    barbershopId: workingHour.barbershopId,
    dayOfWeek: dayOfWeekByWeekday[workingHour.weekday],
    opensAt: workingHour.isClosed
      ? null
      : minutesToTime(workingHour.opensAtMinute),
    closesAt: workingHour.isClosed
      ? null
      : minutesToTime(workingHour.closesAtMinute),
    isOpen: !workingHour.isClosed,
    createdAt: workingHour.createdAt,
    updatedAt: workingHour.updatedAt,
  };
}

function timeToMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");

  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
