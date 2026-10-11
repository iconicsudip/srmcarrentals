import { prisma } from "@/lib/prisma";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import { processRazorpayRefund, resolveRazorpayPaymentId } from "@/lib/razorpay/razorpay-service";

const ACTIVE_REFUND = ["REQUESTED", "PROCESSING", "COMPLETED"] as const;

/** Money already refunded (or being refunded) for a payment. */
export function refundedSoFar(refunds: { amount: unknown; status: string }[]): number {
  return refunds.filter((r) => (ACTIVE_REFUND as readonly string[]).includes(r.status)).reduce((sum, r) => sum + Number(r.amount), 0);
}

/**
 * Refunds (part of) a payment. Razorpay payments are refunded through Razorpay (the money goes back to
 * the customer's original payment method); `manual: true` just records a refund made outside Razorpay
 * (e.g. cash / UPI handed back at the counter).
 */
export async function refundPayment(input: { paymentId: string; amount?: number; reason?: string; manual?: boolean }) {
  const payment = await prisma.payment.findUnique({ where: { id: input.paymentId }, include: { refunds: true } });
  if (!payment) throw new NotFoundError("Payment not found");

  // The webhook can record one real payment more than once (link-paid + captured events): treat rows that
  // share a provider payment id as the same money, so it can only be refunded once.
  const siblings = payment.providerPaymentId
    ? await prisma.payment.findMany({ where: { providerPaymentId: payment.providerPaymentId }, include: { refunds: true } })
    : [payment];
  const allRefunds = siblings.flatMap((s) => s.refunds);
  if (payment.status !== "PAID" && payment.status !== "PARTIALLY_PAID") {
    throw new BadRequestError("Only a paid payment can be refunded");
  }

  const remaining = Math.round((Number(payment.amount) - refundedSoFar(allRefunds)) * 100) / 100;
  if (remaining <= 0) throw new BadRequestError("This payment has already been fully refunded");

  const amount = Math.round((input.amount ?? remaining) * 100) / 100;
  if (!(amount > 0)) throw new BadRequestError("Enter a refund amount greater than zero");
  if (amount > remaining) throw new BadRequestError(`You can refund at most ₹${remaining.toLocaleString("en-IN")} on this payment`);

  const reason = input.reason?.trim() || "Refund";
  let providerRefundId: string;

  if (payment.provider === "RAZORPAY" && !input.manual) {
    const rzpPaymentId = await resolveRazorpayPaymentId(payment.providerPaymentId);
    if (!rzpPaymentId) {
      throw new BadRequestError("Could not find the Razorpay payment id for this payment. Use a manual refund if you paid the money back yourself.");
    }
    const res = await processRazorpayRefund({ paymentId: rzpPaymentId, amount, reason });
    if (!res.success || !res.refundId) {
      await prisma.refund.create({ data: { paymentId: payment.id, amount, reason, status: "FAILED" } });
      throw new BadRequestError(res.error || "Razorpay could not process this refund");
    }
    providerRefundId = res.refundId;
  } else {
    providerRefundId = `manual_${Date.now()}`;
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.refund.create({
      data: { paymentId: payment.id, amount, reason, status: "COMPLETED", providerRefundId, processedAt: new Date() },
    });
    await tx.transaction.create({
      data: { paymentId: payment.id, type: "REFUND", amount, status: "REFUNDED", providerReference: providerRefundId },
    });
    if (amount >= remaining) {
      await tx.payment.updateMany({ where: { id: { in: siblings.map((s) => s.id) } }, data: { status: "REFUNDED" } });
    }
    return created;
  });

  return refund;
}
