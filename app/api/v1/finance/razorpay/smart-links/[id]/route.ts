import { requirePermission } from "@/lib/auth/rbac";
import { NotFoundError } from "@/lib/http/errors";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import {
  cancelSmartPaymentLink,
  listSmartLinks,
  resendSmartPaymentLink,
  saveSmartLinks,
  syncSmartPaymentLinkStatus,
} from "@/lib/razorpay/razorpay-service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { id } = await params;

  const link = await syncSmartPaymentLinkStatus(id);
  if (!link) throw new NotFoundError("Payment link not found");

  return ok(link);
});

export const POST = withErrorHandling<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (body.action === "complete") {
    const links = await listSmartLinks();
    const index = links.findIndex((l) => l.id === id || l.razorpayLinkId === id);
    if (index === -1) throw new NotFoundError("Payment link not found");
    const target = links[index]!;
    target.status = "PAID";
    target.paidAt = new Date().toISOString();
    target.updatedAt = new Date().toISOString();
    links[index] = target;
    await saveSmartLinks(links);

    if (target.bookingReference) {
      const { confirmBookingWithPayment } = await import("@/modules/bookings/bookings.service");
      await confirmBookingWithPayment({
        bookingReference: target.bookingReference,
        paymentId: `sim_${id}`,
        amount: target.amount,
      });
    }

    return ok(target);
  }

  await requirePermission("payments.view");

  if (body.action === "cancel") {
    const success = await cancelSmartPaymentLink(id);
    return ok({ success });
  }

  if (body.action === "resend") {
    const medium = body.medium === "email" ? "email" : "sms";
    const success = await resendSmartPaymentLink(id, medium);
    return ok({ success });
  }

  if (body.action === "sync") {
    const link = await syncSmartPaymentLinkStatus(id);
    return ok(link);
  }

  throw new Error(`Unknown action: ${body.action}`);
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("payments.view");
  const { id } = await params;

  const success = await cancelSmartPaymentLink(id);
  return ok({ success });
});
