import { prisma } from "@/lib/prisma";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import type { CreateRoleInput, UpdateRoleInput } from "@/modules/roles/roles.schemas";

const ROLE_INCLUDE = {
  permissions: { include: { permission: true } },
  _count: { select: { users: true } },
} as const;

export function listRoles() {
  return prisma.role.findMany({ include: ROLE_INCLUDE, orderBy: { createdAt: "asc" } });
}

export async function getRole(id: string) {
  const role = await prisma.role.findUnique({ where: { id }, include: ROLE_INCLUDE });
  if (!role) throw new NotFoundError("Role not found");
  return role;
}

const toRoleKey = (v: string) =>
  v
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export async function createRole(input: CreateRoleInput) {
  const permissions = await prisma.permission.findMany({ where: { key: { in: input.permissionKeys } } });

  // a unique key: CITY_MANAGER, then CITY_MANAGER_2 …
  const base = toRoleKey(input.name || input.label) || "ROLE";
  let name = base;
  for (let n = 2; await prisma.role.findUnique({ where: { name } }); n++) name = `${base}_${n}`;

  return prisma.role.create({
    data: {
      name,
      label: input.label,
      description: input.description,
      permissions: { create: permissions.map((p) => ({ permissionId: p.id })) },
    },
    include: ROLE_INCLUDE,
  });
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw new NotFoundError("Role not found");

  if (input.permissionKeys) {
    const permissions = await prisma.permission.findMany({ where: { key: { in: input.permissionKeys } } });
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: id, permissionId: p.id })),
    });
  }

  return prisma.role.update({
    where: { id },
    data: { label: input.label, description: input.description },
    include: ROLE_INCLUDE,
  });
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new NotFoundError("Role not found");
  if (role.isSystem) throw new BadRequestError("System roles cannot be deleted");
  if (role._count.users > 0) throw new BadRequestError("Cannot delete a role that still has users assigned");

  await prisma.role.delete({ where: { id } });
}
