import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getDashboardOverview } from "@/modules/analytics/analytics.service";

/**
 * @swagger
 * /analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Dashboard KPI overview (cars, bookings, customers, revenue)
 *     responses:
 *       200: { description: Overview stats. }
 */
export const GET = withErrorHandling(async () => {
  await requirePermission("dashboard.view");
  return ok(await getDashboardOverview());
});
