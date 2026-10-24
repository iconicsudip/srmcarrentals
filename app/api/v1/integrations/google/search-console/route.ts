import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { ApiHttpException } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSearchConsoleReport } from "@/lib/integrations/google.server";

export const dynamic = "force-dynamic";

/** Admin: Search Console performance (clicks, impressions, CTR, position, top queries and pages). */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("settings.manage");
  const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get("days")) || 28));
  try {
    return ok(await getSearchConsoleReport(days));
  } catch (e) {
    throw new ApiHttpException(400, e instanceof Error ? e.message : "Could not load Search Console data", "Bad Request");
  }
});
