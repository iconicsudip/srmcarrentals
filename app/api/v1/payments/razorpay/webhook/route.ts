import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getRazorpayConfig,
  listSmartLinks,
  saveSmartLinks,
  verifyWebhookSignature,
} from "@/lib/razorpay/razorpay-service";

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
              ? await prisma.booking.findUnique({ where: { id: target.bookingId } })
              : await prisma.booking.findUnique({ where: { bookingReference: target.bookingReference } });

            if (booking) {
              const payment = await prisma.payment.create({
                data: {
                  bookingId: booking.id,
                  provider: "RAZORPAY",
                  paymentType: "FULL",
                  amount: target.amount,
                  status: "PAID",
                  providerPaymentId: payload?.payment?.entity?.id || plink.id,
                  paidAt: new Date(),
                },
              });

              await prisma.transaction.create({
                data: {
                  paymentId: payment.id,
                  type: "PAYMENT",
                  amount: target.amount,
                  status: "PAID",
                  providerReference: plink.id,
                  rawResponse: event,
                },
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
        });

        if (booking) {
          const amountInr = (paymentEntity.amount || 0) / 100;
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              provider: "RAZORPAY",
              paymentType: "FULL",
              amount: amountInr,
              status: "PAID",
              providerPaymentId: paymentEntity.id,
              providerOrderId: paymentEntity.order_id,
              paidAt: new Date(),
            },
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Webhook processing error" }, { status: 500 });
  }
}
