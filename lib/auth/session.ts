import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { verifyAccessToken, type AccessTokenPayload } from "@/lib/auth/jwt";
import { UnauthorizedError } from "@/lib/http/errors";

/** Reads and verifies the access-token cookie. Works in Server Components,
 * layouts, and Route Handlers alike (all read from the same request-scoped
 * cookie jar). Returns null instead of throwing so callers can decide
 * whether the route is optionally- or strictly-authenticated. */
export async function getSession(): Promise<AccessTokenPayload | null> {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}

/** Same as getSession(), but throws 401 when there's no valid session —
 * use at the top of any protected route handler / server action. */
export async function requireSession(): Promise<AccessTokenPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
