import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { clearAuthCookies, REFRESH_TOKEN_COOKIE } from "@/lib/auth/cookies";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { revokeRefreshToken } from "@/modules/auth/token.service";

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the current refresh token and clear auth cookies
 *     responses:
 *       200: { description: Logged out. }
 */
export const POST = withErrorHandling(async () => {
  const store = await cookies();
  const rawRefreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
});
