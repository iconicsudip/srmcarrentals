import { requirePermission } from "@/lib/auth/rbac";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { CAR_ENQUIRIES_SETTING_KEY, type CarEnquiry, type CarEnquiryStatus } from "@/lib/car-enquiry/types";

type Ctx = { params: Promise<{ id: string }> };

const STATUSES: CarEnquiryStatus[] = ["NEW", "CONTACTED", "CONFIRMED", "CANCELLED"];

async function load(): Promise<CarEnquiry[]> {
  const rows = await getSetting<CarEnquiry[]>(CAR_ENQUIRIES_SETTING_KEY);
  return Array.isArray(rows) ? rows : [];
}

/** Admin: update an enquiry's status. */
export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("settings.manage");
  const { id } = await params;
  const { status } = (await req.json()) as { status?: CarEnquiryStatus };
  if (!status || !STATUSES.includes(status)) throw new BadRequestError("Invalid status");

  const rows = await load();
  const target = rows.find((r) => r.id === id);
  if (!target) throw new NotFoundError("Enquiry not found");
  target.status = status;
  await setSetting(CAR_ENQUIRIES_SETTING_KEY, rows);
  return ok(target);
});

/** Admin: delete an enquiry. */
export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("settings.manage");
  const { id } = await params;
  const rows = await load();
  if (!rows.some((r) => r.id === id)) throw new NotFoundError("Enquiry not found");
  await setSetting(
    CAR_ENQUIRIES_SETTING_KEY,
    rows.filter((r) => r.id !== id),
  );
  return ok({ deleted: true });
});
