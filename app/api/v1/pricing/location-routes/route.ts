import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getRouteCharges, saveRouteCharges } from "@/lib/pricing/location-routes.server";

/** Public: pickup → drop charges (the booking pages need them to show the fee). */
export const GET = withErrorHandling(async () => ok(await getRouteCharges()));

/** Admin: replace all pickup → drop charges. */
export const PUT = withErrorHandling(async (req) => {
  await requirePermission("pricing.manage");
  return ok(await saveRouteCharges(await req.json()));
});
