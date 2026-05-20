import { prisma } from "../../lib/prisma.js";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "./service.schemas.js";

const serviceSelect = {
  id: true,
  barbershopId: true,
  name: true,
  description: true,
  priceInCents: true,
  durationMinutes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function createService(ownerId: string, input: CreateServiceInput) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  const service = await prisma.service.create({
    data: {
      barbershopId: barbershop.id,
      name: input.name,
      description: input.description,
      priceInCents: input.priceInCents,
      durationMinutes: input.durationInMinutes,
    },
    select: serviceSelect,
  });

  return formatService(service);
}

export async function listServices(ownerId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);

  const services = await prisma.service.findMany({
    where: {
      barbershopId: barbershop.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: serviceSelect,
  });

  return services.map(formatService);
}

export async function getService(ownerId: string, serviceId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const service = await findOwnedService(barbershop.id, serviceId);

  if (!service) {
    throw new ServiceError("Serviço não encontrado.", 404);
  }

  return formatService(service);
}

export async function updateService(
  ownerId: string,
  serviceId: string,
  input: UpdateServiceInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingService = await findOwnedService(barbershop.id, serviceId);

  if (!existingService) {
    throw new ServiceError("Serviço não encontrado.", 404);
  }

  const service = await prisma.service.update({
    where: {
      id: serviceId,
    },
    data: {
      name: input.name,
      description: input.description,
      priceInCents: input.priceInCents,
      durationMinutes: input.durationInMinutes,
      isActive: input.isActive,
    },
    select: serviceSelect,
  });

  return formatService(service);
}

export async function deactivateService(ownerId: string, serviceId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const existingService = await findOwnedService(barbershop.id, serviceId);

  if (!existingService) {
    throw new ServiceError("Serviço não encontrado.", 404);
  }

  const service = await prisma.service.update({
    where: {
      id: serviceId,
    },
    data: {
      isActive: false,
    },
    select: serviceSelect,
  });

  return formatService(service);
}

export async function listPublicServicesByBarbershopSlug(slug: string) {
  const barbershop = await prisma.barbershop.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
    },
  });

  if (!barbershop) {
    throw new ServiceError("Barbearia não encontrada.", 404);
  }

  const services = await prisma.service.findMany({
    where: {
      barbershopId: barbershop.id,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: serviceSelect,
  });

  return services.map(formatService);
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
    throw new ServiceError("Cadastre uma barbearia antes de criar serviços.", 400);
  }

  return barbershop;
}

async function findOwnedService(barbershopId: string, serviceId: string) {
  return prisma.service.findFirst({
    where: {
      id: serviceId,
      barbershopId,
    },
    select: serviceSelect,
  });
}

function formatService(service: {
  id: string;
  barbershopId: string;
  name: string;
  description: string | null;
  priceInCents: number;
  durationMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: service.id,
    barbershopId: service.barbershopId,
    name: service.name,
    description: service.description,
    priceInCents: service.priceInCents,
    durationInMinutes: service.durationMinutes,
    isActive: service.isActive,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}
