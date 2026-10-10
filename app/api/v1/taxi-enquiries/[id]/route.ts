import { requirePermission } from "@/lib/auth/rbac";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { TAXI_ENQUIRIES_SETTING_KEY, type TaxiEnquiry, type TaxiEnquiryStatus } from "@/lib/taxi-enquiry/form";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES: TaxiEnquiryStatus[] = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"];

async function load(): Promise<TaxiEnquiry[]> {
  const rows = await getSetting<TaxiEnquiry[]>(TAXI_ENQUIRIES_SETTING_KEY);
  return Array.isArray(rows) ? rows : [];
}

/** Admin: update an enquiry's status. */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("settings.manage");
  const { id } = await params;
  const { status } = (await req.json()) as { status?: TaxiEnquiryStatus };
  if (!status || !STATUSES.includes(status)) throw new BadRequestError("Invalid status");

  const rows = await load();
  const target = rows.find((r) => r.id === id);
  if (!target) throw new NotFoundError("Enquiry not found");
  target.status = status;
  await setSetting(TAXI_ENQUIRIES_SETTING_KEY, rows);
  return ok(target);
});

/** Admin: delete an enquiry. */
export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("settings.manage");
  const { id } = await params;
  const rows = await load();
  if (!rows.some((r) => r.id === id)) throw new NotFoundError("Enquiry not found");
  await setSetting(
    TAXI_ENQUIRIES_SETTING_KEY,
    rows.filter((r) => r.id !== id),
  );
  return ok({ deleted: true });
});
