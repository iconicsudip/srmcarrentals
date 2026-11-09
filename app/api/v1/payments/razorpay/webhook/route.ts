import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getRazorpayConfig,
  listSmartLinks,
  saveSmartLinks,
  verifyWebhookSignature,
} from "@/lib/razorpay/razorpay-service";

/**
 * Razorpay sends "payment_link.paid" and "payment.captured" for the same payment within a second of each other.
 * Checking-then-creating was racing, so one payment was saved twice. This serialises them per payment id: the first
 * event records the payment, the second finds it and does nothing.
 */
async function recordPaymentOnce(
  bookingId: string,
  providerPaymentId: string,
  create: (tx: Prisma.TransactionClient) => Promise<void>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${providerPaymentId}))`;
    const existing = await tx.payment.findFirst({ where: { bookingId, providerPaymentId } });
    if (!existing) await create(tx);
  });
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const config = await getRazorpayConfig();

    // Verify webhook signature if webhook secret is configured
    if (config.webhookSecret) {
      const isValid = verifyWebhookSignature(rawBody, signature, config.webhookSecret);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    if (eventType === "payment_link.paid") {
      const plink = payload?.payment_link?.entity;
      if (plink) {
        const links = await listSmartLinks();
        const index = links.findIndex(
          (l) => l.razorpayLinkId === plink.id || l.id === plink.reference_id,
        );

        if (index !== -1) {
          const target = links[index]!;
          target.status = "PAID";
          target.paidAt = new Date().toISOString();
          target.updatedAt = new Date().toISOString();
          links[index] = target;
          await saveSmartLinks(links);

          // If linked to an SRM booking, record the payment
          if (target.bookingId || target.bookingReference) {
            const booking = target.bookingId
              ? await prisma.booking.findUnique({ where: { id: target.bookingId }, include: { pricingSnapshot: true } })
              : await prisma.booking.findUnique({ where: { bookingReference: target.bookingReference }, include: { pricingSnapshot: true } });

            if (booking) {
              await prisma.booking.update({
                where: { id: booking.id },
                data: { status: "CONFIRMED" },
              });

              const rzpPaymentId = payload?.payment?.entity?.id || plink.id;
              await recordPaymentOnce(booking.id, rzpPaymentId, async (tx) => {
                const payment = await tx.payment.create({
                  data: {
                    bookingId: booking.id,
                    provider: "RAZORPAY",
                    paymentType:
                      Number(booking.pricingSnapshot?.grandTotal ?? 0) > target.amount ? "ADVANCE" : "FULL",
                    amount: target.amount,
                    status: "PAID",
                    providerPaymentId: rzpPaymentId,
                    paidAt: new Date(),
                  },
                });

                await tx.transaction.create({
                  data: {
                    paymentId: payment.id,
                    type: "PAYMENT",
                    amount: target.amount,
                    status: "PAID",
                    providerReference: plink.id,
                    rawResponse: event,
                  },
                });
              });
            }
          }
        }
      }
    } else if (eventType === "payment.captured") {
      const paymentEntity = payload?.payment?.entity;
      if (paymentEntity?.notes?.bookingReference) {
        const booking = await prisma.booking.findUnique({
          where: { bookingReference: paymentEntity.notes.bookingReference },
          include: { pricingSnapshot: true },
        });

        if (booking) {
          await prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CONFIRMED" },
          });

          const amountInr = (paymentEntity.amount || 0) / 100;
          await recordPaymentOnce(booking.id, paymentEntity.id, async (tx) => {
            await tx.payment.create({
              data: {
                bookingId: booking.id,
                provider: "RAZORPAY",
                paymentType: Number(booking.pricingSnapshot?.grandTotal ?? 0) > amountInr ? "ADVANCE" : "FULL",
                amount: amountInr,
                status: "PAID",
                providerPaymentId: paymentEntity.id,
                providerOrderId: paymentEntity.order_id,
                paidAt: new Date(),
              },
            });
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
