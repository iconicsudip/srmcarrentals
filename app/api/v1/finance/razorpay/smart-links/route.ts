import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import {
  createSmartPaymentLink,
  listSmartLinks,
} from "@/lib/razorpay/razorpay-service";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("payments.view");
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.toLowerCase().trim();

  let links = await listSmartLinks();

  if (status && status !== "ALL") {
    links = links.filter((l) => l.status === status);
  }

  if (search) {
    links = links.filter(
      (l) =>
        l.customerName.toLowerCase().includes(search) ||
        l.purpose.toLowerCase().includes(search) ||
        (l.bookingReference && l.bookingReference.toLowerCase().includes(search)) ||
        (l.customerPhone && l.customerPhone.includes(search)) ||
        (l.customerEmail && l.customerEmail.toLowerCase().includes(search)) ||
        l.shortUrl.toLowerCase().includes(search),
    );
  }

  return ok({ links });
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("payments.view");
  const body = await req.json();

  if (!body.amount || Number(body.amount) <= 0) {
    throw new Error("Amount must be greater than 0");
  }
  if (!body.customerName?.trim()) {
    throw new Error("Customer name is required");
  }
  if (!body.purpose?.trim()) {
    throw new Error("Payment purpose / title is required");
  }

  const url = new URL(req.url);
  const origin = url.origin;

  const link = await createSmartPaymentLink({
    amount: Number(body.amount),
    purpose: body.purpose.trim(),
    customerName: body.customerName.trim(),
    customerPhone: body.customerPhone?.trim(),
    customerEmail: body.customerEmail?.trim(),
    bookingReference: body.bookingReference?.trim(),
    bookingId: body.bookingId?.trim(),
    expireInMinutes: body.expireInMinutes ? Number(body.expireInMinutes) : undefined,
    allowPartial: Boolean(body.allowPartial),
    notifySms: Boolean(body.notifySms),
    notifyEmail: Boolean(body.notifyEmail),
    origin,
  });

  return ok(link);
});
