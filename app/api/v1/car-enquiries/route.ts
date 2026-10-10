import { requirePermission } from "@/lib/auth/rbac";
import { BadRequestError } from "@/lib/http/errors";
import { created, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { getCompanyContent } from "@/modules/website/public-content.service";
import {
  CAR_ENQUIRIES_SETTING_KEY,
  MAX_STORED_CAR_ENQUIRIES,
  toTenDigits,
  type CarEnquiry,
} from "@/lib/car-enquiry/types";

/** Admin: list collected car enquiries. */
export const GET = withErrorHandling(async () => {
  await requirePermission("settings.manage");
  const rows = await getSetting<CarEnquiry[]>(CAR_ENQUIRIES_SETTING_KEY);
  return ok(Array.isArray(rows) ? rows : []);
});

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Public: submit a booking enquiry from a car card. Returns the WhatsApp number to continue the chat on. */
export const POST = withErrorHandling(async (req) => {
  const body = (await req.json()) as Record<string, unknown>;

  // Honeypot: real users never fill this hidden field.
  if (clean(body.website, 50)) return created({ id: "ok", whatsappNumber: "" });

  const carId = clean(body.carId, 100);
  const carName = clean(body.carName, 200);
  const name = clean(body.name, 120);
  const phone = toTenDigits(clean(body.phone, 30));
  const email = clean(body.email, 160);

  if (!carId || !carName) throw new BadRequestError("Invalid enquiry payload");
  if (!name) throw new BadRequestError("Full name is required");
  if (phone.length !== 10) throw new BadRequestError("Enter a valid 10-digit mobile number");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestError("Email is not valid");

  const enquiry: CarEnquiry = {
    id: `cenq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    carId,
    carSlug: clean(body.carSlug, 200) || undefined,
    carName,
    name,
    phone,
    email: email || undefined,
    pickupAt: clean(body.pickupAt, 40) || undefined,
    dropAt: clean(body.dropAt, 40) || undefined,
    pickupLocation: clean(body.pickupLocation, 200) || undefined,
    notes: clean(body.notes, 1000) || undefined,
    source: "CAR_CARD_WHATSAPP",
    status: "NEW",
    createdAt: new Date().toISOString(),
  };

  const existing = await getSetting<CarEnquiry[]>(CAR_ENQUIRIES_SETTING_KEY);
  const next = [enquiry, ...(Array.isArray(existing) ? existing : [])].slice(0, MAX_STORED_CAR_ENQUIRIES);
  await setSetting(CAR_ENQUIRIES_SETTING_KEY, next);

  const company = await getCompanyContent();
  const whatsappNumber = (company.socialLinks?.whatsapp?.match(/wa\.me\/(\d+)/)?.[1] ?? company.phone ?? "").replace(/[^0-9]/g, "");

  return created({ id: enquiry.id, whatsappNumber });
});
