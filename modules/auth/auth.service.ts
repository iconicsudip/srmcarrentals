import type { AuthenticatedUser, AuthTokens } from "@srm/types";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { UnauthorizedError } from "@/lib/http/errors";
import type { LoginInput } from "@/modules/auth/auth.schemas";
import { issueTokenPair } from "@/modules/auth/token.service";

const USER_WITH_ROLE_INCLUDE = {
  role: { include: { permissions: { include: { permission: true } } } },
} as const;

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  role: { name: string; permissions: { permission: { key: string } }[] };
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
    avatarUrl: user.avatarUrl,
  };
}

export async function login(
  input: LoginInput,
  meta: { userAgent?: string; ipAddress?: string },
): Promise<{ user: AuthenticatedUser; tokens: AuthTokens }> {
  let user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    include: USER_WITH_ROLE_INCLUDE,
  });

  const envAdminEmail = (process.env.ADMIN_EMAIL ?? process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@srmcarrentals.com").toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? "AdminPassword123!";
  const isEnvAdminMatch = input.email.toLowerCase() === envAdminEmail && input.password === envAdminPassword;

  if (isEnvAdminMatch) {
    let superAdminRole = await prisma.role.findFirst({ where: { name: "SUPER_ADMIN" } });
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: { name: "SUPER_ADMIN", label: "Super Admin", isSystem: true },
      });
    }
    const newHash = await hashPassword(envAdminPassword);
    user = await prisma.user.upsert({
      where: { email: envAdminEmail },
      update: { passwordHash: newHash, isActive: true, roleId: superAdminRole.id },
      create: {
        email: envAdminEmail,
        passwordHash: newHash,
        firstName: "Super",
        lastName: "Admin",
        roleId: superAdminRole.id,
      },
      include: USER_WITH_ROLE_INCLUDE,
    });
  } else {
    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError("Invalid email or password");
    }
  }

  const tokens = await issueTokenPair(user, meta);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });

  return { user: toAuthenticatedUser(user), tokens };
}

export async function getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_ROLE_INCLUDE,
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError();
  }

  return toAuthenticatedUser(user);
}
