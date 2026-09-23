import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { NotFoundError } from "@/lib/http/errors";
import type { PaginationParams } from "@/lib/http/pagination";
import type { CreateUserInput, UpdateUserInput } from "@/modules/users/users.schemas";

const USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  role: { select: { id: true, name: true, label: true } },
} as const;

export async function listUsers(pagination: PaginationParams, search?: string, roleNames?: string[]) {
  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(roleNames && roleNames.length > 0
      ? { role: { name: { in: roleNames as Prisma.EnumRoleNameFilter["in"] } } }
      : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count({ where }),
  ]);

  return { data, total };
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SELECT });
  if (!user) throw new NotFoundError("User not found");
  return user;
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: input.roleId,
    },
    select: USER_SELECT,
  });
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("User not found");

  return prisma.user.update({
    where: { id },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      roleId: input.roleId,
      isActive: input.isActive,
      passwordHash: input.password ? await hashPassword(input.password) : undefined,
    },
    select: USER_SELECT,
  });
}

export async function deleteUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("User not found");
  // Soft-delete via deactivation — preserves FK history (audit logs, bookings, etc.)
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}
