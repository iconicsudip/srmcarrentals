import { createHash } from "node:crypto";
import { nanoid } from "nanoid";

import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/auth/jwt";
import { parseDurationToSeconds } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/env";
import { UnauthorizedError } from "@/lib/http/errors";
import type { AuthTokens } from "@srm/types";

interface UserForToken {
  id: string;
  email: string;
  role: { name: string; permissions: { permission: { key: string } }[] };
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function permissionsOf(user: UserForToken): string[] {
  return user.role.permissions.map((rp) => rp.permission.key);
}

/** Issues a fresh access+refresh token pair and persists the refresh token
 * (hashed) so it can be looked up, rotated, or revoked later. */
export async function issueTokenPair(
  user: UserForToken,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<AuthTokens> {
  const jti = nanoid();
  const refreshToken = await signRefreshToken({ sub: user.id, jti });
  const accessToken = await signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role.name,
    permissions: permissionsOf(user),
  });

  const expiresAt = new Date(Date.now() + parseDurationToSeconds(getEnv().JWT_REFRESH_TTL) * 1000);

  await prisma.refreshToken.create({
    data: {
      id: jti,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
    },
  });

  return { accessToken, refreshToken };
}

/** Verifies a refresh token JWT + its DB record, then rotates it: the old
 * record is revoked and a brand new pair is issued. Rotation limits the
 * blast radius of a leaked refresh token to a single use. */
export async function rotateRefreshToken(
  rawRefreshToken: string,
  meta: { userAgent?: string; ipAddress?: string } = {},
): Promise<AuthTokens> {
  let payload;
  try {
    payload = await verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError("Refresh token has been revoked or expired");
  }

  if (stored.tokenHash !== hashToken(rawRefreshToken)) {
    // Token hash mismatch on an otherwise-valid, non-revoked record implies
    // token reuse/theft. Revoke the whole family defensively.
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new UnauthorizedError("Refresh token reuse detected; all sessions revoked");
  }

  const user = await prisma.user.findUnique({
    where: { id: stored.userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Account is inactive");
  }

  const newTokens = await issueTokenPair(user, meta);

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date(), replacedByTokenHash: hashToken(newTokens.refreshToken) },
  });

  return newTokens;
}

export async function revokeRefreshToken(rawRefreshToken: string): Promise<void> {
  try {
    const payload = await verifyRefreshToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // already invalid/expired — nothing to revoke
  }
}
