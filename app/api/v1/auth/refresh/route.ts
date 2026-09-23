import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { REFRESH_TOKEN_COOKIE, setAuthCookies } from "@/lib/auth/cookies";
import { UnauthorizedError } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { rotateRefreshToken } from "@/modules/auth/token.service";

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the refresh token cookie and issue a new access token
 *     responses:
 *       200: { description: New tokens set as httpOnly cookies. }
 *       401: { description: Missing, expired, or revoked refresh token. }
 */
export const POST = withErrorHandling(async (req) => {
  const store = await cookies();
  const rawRefreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!rawRefreshToken) throw new UnauthorizedError("No refresh token supplied");

  const tokens = await rotateRefreshToken(rawRefreshToken, {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
  });

  const response = NextResponse.json({ success: true });
  setAuthCookies(response, tokens);
  return response;
});
