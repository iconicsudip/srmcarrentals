import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getKmPlansConfig, saveKmPlansConfig } from "@/lib/pricing/km-plans.server";

/** Admin: current KM plan tiers + per-car prices. */
export const GET = withErrorHandling(async () => {
  await requirePermission("pricing.manage");
  return ok(await getKmPlansConfig());
});

/** Admin: save KM plan tiers + per-car prices. */
export const PUT = withErrorHandling(async (req) => {
  await requirePermission("pricing.manage");
  return ok(await saveKmPlansConfig(await req.json()));
});
