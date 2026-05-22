import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { prisma } from "../../lib/prisma.js";
import type { CreateBarbershopInput } from "./barbershop.schemas.js";

const publicBarbershopSelect = {
  id: true,
  name: true,
  slug: true,
  phone: true,
  address: true,
};

export class BarbershopError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function createBarbershop(
  ownerId: string,
  input: CreateBarbershopInput,
) {
  const existingOwnerBarbershop = await prisma.barbershop.findUnique({
    where: {
      ownerId,
    },
    select: {
      id: true,
    },
  });

  if (existingOwnerBarbershop) {
    throw new BarbershopError(
      "Usuário já possui uma barbearia cadastrada.",
      409,
    );
  }

  const existingSlug = await prisma.barbershop.findUnique({
    where: {
      slug: input.slug,
    },
    select: {
      id: true,
    },
  });

  if (existingSlug) {
    throw new BarbershopError("Slug já cadastrado.", 409);
  }

  return persistBarbershop(ownerId, input);
}

export async function getPublicBarbershopBySlug(slug: string) {
  const barbershop = await prisma.barbershop.findUnique({
    where: {
      slug,
    },
    select: publicBarbershopSelect,
  });

  if (!barbershop) {
    throw new BarbershopError("Barbearia não encontrada.", 404);
  }

  return barbershop;
}

export async function getMyBarbershop(ownerId: string) {
  return prisma.barbershop.findUnique({
    where: {
      ownerId,
    },
    select: publicBarbershopSelect,
  });
}

async function persistBarbershop(
  ownerId: string,
  input: CreateBarbershopInput,
) {
  try {
    return await prisma.barbershop.create({
      data: {
        ownerId,
        name: input.name,
        slug: input.slug,
        phone: input.phone,
        address: input.address,
      },
      select: publicBarbershopSelect,
    });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target
        : [];

      if (target.includes("ownerId")) {
        throw new BarbershopError(
          "Usuário já possui uma barbearia cadastrada.",
          409,
        );
      }

      if (target.includes("slug")) {
        throw new BarbershopError("Slug já cadastrado.", 409);
      }
    }

    throw error;
  }
}
