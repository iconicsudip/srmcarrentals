import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth/cookies";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { loginSchema } from "@/modules/auth/auth.schemas";
import { login } from "@/modules/auth/auth.service";

function requestMeta(req: Request) {
  return {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
  };
}

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password, minLength: 8 }
 *     responses:
 *       200:
 *         description: Sets httpOnly access/refresh cookies and returns the authenticated user.
 *       401:
 *         description: Invalid credentials.
 */
export const POST = withErrorHandling(async (req) => {
  const body = loginSchema.parse(await req.json());
  const { user, tokens } = await login(body, requestMeta(req));

  const response = NextResponse.json({ user });
  setAuthCookies(response, tokens);
  return response;
});
