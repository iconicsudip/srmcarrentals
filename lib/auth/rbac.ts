import type { Permission } from "@srm/types";

import { requireSession } from "@/lib/auth/session";
import type { AccessTokenPayload } from "@/lib/auth/jwt";
import { ForbiddenError } from "@/lib/http/errors";

/** Require a valid session AND that it carries every given permission.
 * SUPER_ADMIN implicitly bypasses granular permission checks (matches the
 * seed data, where SUPER_ADMIN is granted every Permission row anyway —
 * this is just a fast path). */
export async function requirePermission(...permissions: Permission[]): Promise<AccessTokenPayload> {
  const session = await requireSession();

  if (session.role === "SUPER_ADMIN") return session;

  const missing = permissions.filter((p) => !session.permissions.includes(p));
  if (missing.length > 0) {
    throw new ForbiddenError(`Missing required permission(s): ${missing.join(", ")}`);
  }

  return session;
}

export function hasPermission(session: AccessTokenPayload, permission: Permission): boolean {
  return session.role === "SUPER_ADMIN" || session.permissions.includes(permission);
}
