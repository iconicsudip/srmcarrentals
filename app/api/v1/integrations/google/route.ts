import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { ApiHttpException } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { clearGoogleIntegration, getGoogleStatus, saveGoogleIntegration } from "@/lib/integrations/google.server";

/** Admin: is a Google service account connected (never returns the key itself). */
export const GET = withErrorHandling(async () => {
  await requirePermission("settings.manage");
  return ok(await getGoogleStatus());
});

/** Admin: save the Search Console property and/or the service-account key file contents. */
export const PUT = withErrorHandling(async (req) => {
  await requirePermission("settings.manage");
  const body = (await req.json()) as { siteUrl?: string; serviceAccountJson?: string };
  try {
    return ok(await saveGoogleIntegration(body));
  } catch (e) {
    throw new ApiHttpException(400, e instanceof Error ? e.message : "Could not save", "Bad Request");
  }
});

/** Admin: disconnect and forget the key. */
export const DELETE = withErrorHandling(async () => {
  await requirePermission("settings.manage");
  await clearGoogleIntegration();
  return ok(await getGoogleStatus());
});
