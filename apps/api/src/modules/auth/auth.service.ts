import { Prisma } from "@prisma/client";
import type { FastifyInstance } from "fastify";
import { compare, hash } from "bcryptjs";

import { prisma } from "../../lib/prisma.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

const PASSWORD_SALT_ROUNDS = 12;

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
};

const barbershopSelect = {
  id: true,
  name: true,
  slug: true,
  phone: true,
  address: true,
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

export async function registerUser(app: FastifyInstance, input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new AuthError("E-mail já cadastrado.", 409);
  }

  const passwordHash = await hash(input.password, PASSWORD_SALT_ROUNDS);

  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  return {
    user,
    token: app.jwt.sign({ sub: user.id }),
  };
}

async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  try {
    return await prisma.user.create({
      data,
      select: publicUserSelect,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AuthError("E-mail já cadastrado.", 409);
    }

    throw error;
  }
}

export async function loginUser(app: FastifyInstance, input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new AuthError("Credenciais inválidas.", 401);
  }

  const passwordMatches = await compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError("Credenciais inválidas.", 401);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token: app.jwt.sign({ sub: user.id }),
  };
}

export async function getAuthenticatedUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      ...publicUserSelect,
      barbershop: {
        select: barbershopSelect,
      },
    },
  });

  if (!user) {
    throw new AuthError("Token inválido ou ausente.", 401);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    barbershop: user.barbershop,
  };
}
