import { prisma } from "../../lib/prisma.js";
import type {
  CreateBarberInput,
  UpdateBarberInput,
} from "./barber.schemas.js";

const barberSelect = {
  id: true,
  barbershopId: true,
  name: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export class BarberError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function createBarber(ownerId: string, input: CreateBarberInput) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  return prisma.barber.create({
    data: {
      barbershopId: barbershop.id,
      name: input.name,
      phone: input.phone,
    },
    select: barberSelect,
  });
}

export async function listBarbers(ownerId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  return prisma.barber.findMany({
    where: {
      barbershopId: barbershop.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: barberSelect,
  });
}

export async function getBarber(ownerId: string, barberId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const barber = await findOwnedBarber(barbershop.id, barberId);

  if (!barber) {
    throw new BarberError("Barbeiro não encontrado.", 404);
  }

  return barber;
}

export async function updateBarber(
  ownerId: string,
  barberId: string,
  input: UpdateBarberInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingBarber = await findOwnedBarber(barbershop.id, barberId);

  if (!existingBarber) {
    throw new BarberError("Barbeiro não encontrado.", 404);
  }

  return prisma.barber.update({
    where: {
      id: barberId,
    },
    data: {
      name: input.name,
      phone: input.phone,
      isActive: input.isActive,
    },
    select: barberSelect,
  });
}

export async function deactivateBarber(ownerId: string, barberId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingBarber = await findOwnedBarber(barbershop.id, barberId);

  if (!existingBarber) {
    throw new BarberError("Barbeiro não encontrado.", 404);
  }

  return prisma.barber.update({
    where: {
      id: barberId,
    },
    data: {
      isActive: false,
    },
    select: barberSelect,
  });
}

export async function listPublicBarbersByBarbershopSlug(slug: string) {
  const barbershop = await prisma.barbershop.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!barbershop) {
    throw new BarberError("Barbearia não encontrada.", 404);
  }

  return prisma.barber.findMany({
    where: {
      barbershopId: barbershop.id,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: barberSelect,
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
    throw new BarberError(
      "Cadastre uma barbearia antes de criar barbeiros.",
      400,
    );
  }

  return barbershop;
}

async function findOwnedBarber(barbershopId: string, barberId: string) {
  return prisma.barber.findFirst({
    where: {
      id: barberId,
      barbershopId,
    },
    select: barberSelect,
  });
}
