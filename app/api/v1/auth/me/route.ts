import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { requireSession } from "@/lib/auth/session";
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
export const GET = withErrorHandling(async () => {
  const session = await requireSession();
  const user = await getAuthenticatedUser(session.sub);
  return ok(user);
});
