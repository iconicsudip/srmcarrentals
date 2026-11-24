import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSession, requireSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/auth.service";

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user + permissions
 *     responses:
 *       200: { description: The authenticated user. }
 *       401: { description: Not authenticated. }
 */
export const GET = withErrorHandling(async (req) => {
  // `?optional=1` is for the public website: a visitor who is not signed in gets `null` instead of a 401 error in the console
  if (new URL(req.url).searchParams.get("optional") === "1") {
    const current = await getSession();
    if (!current) return ok(null);
  }
  const session = await requireSession();
  const user = await getAuthenticatedUser(session.sub);
  return ok(user);
});
