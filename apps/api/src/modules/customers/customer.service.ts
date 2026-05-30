import { AppointmentStatus, Prisma } from "@prisma/client";

import {
  CUSTOMER_PHONE_VALIDATION_MESSAGE,
  isValidCustomerPhone,
  normalizePhone,
} from "../../lib/phone.js";
import { prisma } from "../../lib/prisma.js";
import type {
  ListCustomersQuery,
  UpdateCustomerInput,
} from "./customer.schemas.js";

const customerSelect = Prisma.validator<Prisma.CustomerSelect>()({
  id: true,
  name: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
});

const customerWithAppointmentsSelect = Prisma.validator<Prisma.CustomerSelect>()({
  ...customerSelect,
  appointments: {
    orderBy: {
      startAt: "desc",
    },
    take: 5,
    select: {
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
    },
  },
});

export class CustomerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function listCustomers(
  ownerId: string,
  query: ListCustomersQuery,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const phone = query.phone ? normalizePhone(query.phone) : undefined;
  const searchPhone = query.search ? normalizePhone(query.search) : "";
  const searchConditions: Prisma.CustomerWhereInput[] = query.search
    ? [{ name: { contains: query.search, mode: "insensitive" } }]
    : [];

  if (query.phone && !phone) {
    return [];
  }

  if (searchPhone) {
    searchConditions.push({ phone: { contains: searchPhone } });
  }

  return prisma.customer.findMany({
    where: {
      barbershopId: barbershop.id,
      ...(searchConditions.length > 0
        ? {
            OR: searchConditions,
          }
        : {}),
      ...(phone ? { phone: { contains: phone } } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: customerSelect,
  });
}

export async function getCustomer(ownerId: string, customerId: string) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      barbershopId: barbershop.id,
    },
    select: customerWithAppointmentsSelect,
  });

  if (!customer) {
    throw new CustomerError("Cliente não encontrado.", 404);
  }

  return formatCustomerWithAppointments(customer);
}

export async function updateCustomer(
  ownerId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const barbershop = await getRequiredOwnerBarbershop(ownerId);
  const phone = normalizePhone(input.phone);

  if (!isValidCustomerPhone(phone)) {
    throw new CustomerError(CUSTOMER_PHONE_VALIDATION_MESSAGE, 400);
  }

  const existingCustomer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      barbershopId: barbershop.id,
    },
    select: {
      id: true,
      phone: true,
    },
  });

  if (!existingCustomer) {
    throw new CustomerError("Cliente não encontrado.", 404);
  }

  if (phone !== existingCustomer.phone) {
    const duplicatedCustomer = await prisma.customer.findFirst({
      where: {
        barbershopId: barbershop.id,
        phone,
        id: {
          not: customerId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicatedCustomer) {
      throw new CustomerError(
        "Já existe um cliente com este telefone nesta barbearia.",
        409,
      );
    }
  }

  try {
    return await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name: input.name,
        phone,
      },
      select: customerSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CustomerError(
        "Já existe um cliente com este telefone nesta barbearia.",
        409,
      );
    }

    throw error;
  }
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
    throw new CustomerError(
      "Cadastre uma barbearia antes de consultar clientes.",
      400,
    );
  }

  return barbershop;
}

function formatCustomerWithAppointments(customer: {
  id: string;
  name: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
  appointments: Array<{
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
  }>;
}) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    appointments: customer.appointments.map((appointment) => ({
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
    })),
  };
}
