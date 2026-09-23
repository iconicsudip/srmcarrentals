import { jwtVerify, SignJWT } from "jose";

import { getEnv } from "@/lib/env";

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: string;
  permissions: string[];
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // token id — matches RefreshToken.id in DB for revocation lookups
}

function accessSecret() {
  return new TextEncoder().encode(getEnv().JWT_ACCESS_SECRET);
}

function refreshSecret() {
  return new TextEncoder().encode(getEnv().JWT_REFRESH_SECRET);
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  const env = getEnv();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret());
}

export async function signRefreshToken(payload: RefreshTokenPayload): Promise<string> {
  const env = getEnv();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_TTL)
    .sign(refreshSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret());
  return payload as unknown as AccessTokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, refreshSecret());
  return payload as unknown as RefreshTokenPayload;
}
