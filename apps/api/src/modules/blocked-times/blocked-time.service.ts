import { prisma } from "../../lib/prisma.js";
import type {
  CreateBlockedTimeInput,
  ListBlockedTimesQuery,
  UpdateBlockedTimeInput,
} from "./blocked-time.schemas.js";

const blockedTimeSelect = {
  id: true,
  barbershopId: true,
  barberId: true,
  startAt: true,
  endAt: true,
  reason: true,
  createdAt: true,
  updatedAt: true,
};

export class BlockedTimeError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function createBlockedTime(
  ownerId: string,
  input: CreateBlockedTimeInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const barberId = input.barberId ?? null;

  if (barberId) {
    await getRequiredOwnedBarber(barbershop.id, barberId);
  }

  return prisma.blockedTime.create({
    data: {
      barbershopId: barbershop.id,
      barberId,
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason ?? null,
    },
    select: blockedTimeSelect,
  });
}

export async function listBlockedTimes(
  ownerId: string,
  query: ListBlockedTimesQuery,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  return prisma.blockedTime.findMany({
    where: {
      barbershopId: barbershop.id,
      barberId: query.barberId,
      ...(query.startDate && query.endDate
        ? {
            startAt: {
              gte: query.startDate,
            },
            endAt: {
              lte: query.endDate,
            },
          }
        : {}),
    },
    orderBy: {
      startAt: "asc",
    },
    select: blockedTimeSelect,
  });
}

export async function getBlockedTime(ownerId: string, blockedTimeId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const blockedTime = await findOwnedBlockedTime(
    barbershop.id,
    blockedTimeId,
  );

  if (!blockedTime) {
    throw new BlockedTimeError("Bloqueio não encontrado.", 404);
  }

  return blockedTime;
}

export async function updateBlockedTime(
  ownerId: string,
  blockedTimeId: string,
  input: UpdateBlockedTimeInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingBlockedTime = await findOwnedBlockedTime(
    barbershop.id,
    blockedTimeId,
  );

  if (!existingBlockedTime) {
    throw new BlockedTimeError("Bloqueio não encontrado.", 404);
  }

  const barberId = input.barberId ?? null;

  if (barberId) {
    await getRequiredOwnedBarber(barbershop.id, barberId);
  }

  return prisma.blockedTime.update({
    where: {
      id: blockedTimeId,
    },
    data: {
      barberId,
      startAt: input.startAt,
      endAt: input.endAt,
      reason: input.reason ?? null,
    },
    select: blockedTimeSelect,
  });
}

export async function deleteBlockedTime(ownerId: string, blockedTimeId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingBlockedTime = await findOwnedBlockedTime(
    barbershop.id,
    blockedTimeId,
  );

  if (!existingBlockedTime) {
    throw new BlockedTimeError("Bloqueio não encontrado.", 404);
  }

  await prisma.blockedTime.delete({
    where: {
      id: blockedTimeId,
    },
  });
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
    throw new BlockedTimeError(
      "Cadastre uma barbearia antes de criar bloqueios.",
      400,
    );
  }

  return barbershop;
}

async function getRequiredOwnedBarber(barbershopId: string, barberId: string) {
  const barber = await prisma.barber.findFirst({
    where: {
      id: barberId,
      barbershopId,
    },
    select: {
      id: true,
    },
  });

  if (!barber) {
    throw new BlockedTimeError("Barbeiro não encontrado.", 404);
  }

  return barber;
}

async function findOwnedBlockedTime(
  barbershopId: string,
  blockedTimeId: string,
) {
  return prisma.blockedTime.findFirst({
    where: {
      id: blockedTimeId,
      barbershopId,
    },
    select: blockedTimeSelect,
  });
}
