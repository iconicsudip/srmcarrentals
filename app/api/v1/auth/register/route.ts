import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth/cookies";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { registerSchema } from "@/modules/auth/auth.schemas";
import { register } from "@/modules/auth/auth.service";

function requestMeta(req: Request) {
  return {
    userAgent: req.headers.get("user-agent") ?? undefined,
    ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
  };
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, password]
 *     responses:
 *       201:
 *         description: Sets httpOnly access/refresh cookies and returns the registered user.
 *       409:
 *         description: Account already exists.
 */
export const POST = withErrorHandling(async (req) => {
  const body = registerSchema.parse(await req.json());
  const { user, tokens } = await register(body, requestMeta(req));

  const response = NextResponse.json({ user }, { status: 201 });
  setAuthCookies(response, tokens);
  return response;
});
