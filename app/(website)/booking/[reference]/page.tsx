import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Calendar, CheckCircle2, Clock, MapPin, MessageSquare, Phone, ShieldCheck, Users, Fuel, Cog, ArrowRight, CreditCard, Smartphone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getPublicBookingByReference,
  confirmBookingWithPayment,
  getOrCreateBookingPaymentLink,
} from "@/modules/bookings/bookings.service";
import { getCompanyContent } from "@/modules/website/public-content.service";
import { BookingHoldCountdown } from "@/components/website/booking-hold-countdown";

interface BookingConfirmationPageProps {
  params: Promise<{ reference: string }>;
  searchParams?: Promise<{
    payment_status?: string;
    razorpay_payment_id?: string;
    razorpay_payment_link_id?: string;
    razorpay_payment_link_status?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export async function generateMetadata({ params }: BookingConfirmationPageProps): Promise<Metadata> {
  const { reference } = await params;
  return {
    title: `Booking ${reference} — SRM Car Rentals`,
    description: `Booking confirmation for SRM Car Rentals self-drive reservation ${reference}.`,
  };
}

function formatInr(amount: number | string | null | undefined) {
  if (amount == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(dateStr: string | Date) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function BookingConfirmationPage({ params, searchParams }: BookingConfirmationPageProps) {
  const { reference } = await params;
  const sParams = searchParams ? await searchParams : {};

  const isRazorpayCallback =
    sParams.payment_status === "completed" ||
    Boolean(sParams.razorpay_payment_id) ||
    sParams.razorpay_payment_link_status === "paid";

  let booking;
  try {
    if (isRazorpayCallback) {
      const razorpayPaymentId =
        typeof sParams.razorpay_payment_id === "string" ? sParams.razorpay_payment_id : undefined;
      const confirmed = await confirmBookingWithPayment({
        bookingReference: reference,
        paymentId: razorpayPaymentId,
      });
      booking = JSON.parse(JSON.stringify(confirmed));
    } else {
      booking = await getPublicBookingByReference(reference);
    }
  } catch {
    notFound();
  }

  if (!booking) notFound();

  // If pending, retrieve or create the smart payment link
  const isPending = booking.status === "PENDING" || booking.status === "PAYMENT_PENDING";
  let paymentLinkData = null;
  if (isPending) {
    try {
      paymentLinkData = await getOrCreateBookingPaymentLink(booking.bookingReference);
    } catch (err) {
      console.error("Failed to retrieve booking payment link:", err);
    }
  }

  const company = await getCompanyContent();
  const supportPhone = company?.phone || "+91 9414551250";
  const car = booking.car;
  const pricing = booking.pricingSnapshot;
  const customer = booking.customer;
  const hasPaid = isRazorpayCallback || (booking.payments && booking.payments.some((p: any) => p.status === "PAID"));

  const totalAmountFormatted = formatInr(pricing?.grandTotal ?? 0);
  const whatsappNumber = (company?.socialLinks?.whatsapp || company?.phone || "919414551250").replace(/[^0-9]/g, "");

  const whatsappMessage = encodeURIComponent(
    `Hello SRM Car Rentals! 👋\nI have just booked a self-drive car on your website.\n\n` +
    `📌 *Booking Ref*: ${booking.bookingReference}\n` +
    `🚗 *Vehicle*: ${car?.brand?.name ?? ""} ${car?.model?.name ?? car?.name ?? "Car"}\n` +
    `📅 *Pickup*: ${formatDate(booking.pickupDateTime)}\n` +
    `📅 *Drop*: ${formatDate(booking.dropDateTime)}\n` +
    `💰 *Total Amount*: ${totalAmountFormatted}\n\n` +
    `Please confirm my reservation and share driver/pickup guidelines!`,
  );

  const pickupLocationName = booking.pickupAirport
    ? `${booking.pickupAirport.name} (${booking.pickupAirport.code})`
    : booking.pickupLocation
      ? `${booking.pickupLocation.name}, ${booking.pickupLocation.city}`
      : "SRM Udaipur Headquarters (University Road)";

  const dropLocationName = booking.dropAirport
    ? `${booking.dropAirport.name} (${booking.dropAirport.code})`
    : booking.dropLocation
      ? `${booking.dropLocation.name}, ${booking.dropLocation.city}`
      : "SRM Udaipur Headquarters (University Road)";

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      {/* Header Banner */}
      <div className="border-b border-neutral-200/90 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase">
                    {isPending ? "15-Minute Temporary Hold Active" : "Booking Confirmed"}
                  </span>
                  <Badge className="border-neutral-200 bg-neutral-100 text-neutral-700 font-mono text-xs">Ref: {booking.bookingReference}</Badge>
                </div>
                <h1 className="text-2xl font-black text-neutral-950 sm:text-3xl tracking-tight">Reservation Received!</h1>
              </div>
            </div>

            {/* Support Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-500"
              >
                <MessageSquare className="size-4" /> Confirm on WhatsApp
              </a>
              <a
                href={`tel:${company.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 hover:text-neutral-950"
              >
                <Phone className="size-4 text-orange-500" /> Call {company.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-4 py-10 sm:px-6 lg:px-8">
        {/* Razorpay Phone Verification & Payment Success Banner */}
        {hasPaid && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/80 p-6 shadow-xl shadow-emerald-600/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-200">
                      Razorpay Verified
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">Phone OTP &amp; Payment Authenticated</span>
                  </div>
                  <h2 className="mt-1 text-lg font-black text-neutral-950 sm:text-xl">
                    Phone Verified &amp; Payment Confirmed!
                  </h2>
                  <p className="mt-1 text-xs text-neutral-600 sm:text-sm">
                    Your mobile number was authenticated directly via Razorpay. Your self-drive reservation is locked in and vehicle dispatch has been initiated.
                  </p>
                  {(sParams.razorpay_payment_id || booking.payments?.[0]?.providerPaymentId) && (
                    <p className="mt-2 text-xs font-mono text-neutral-500">
                      Payment ID: {String(sParams.razorpay_payment_id || booking.payments?.[0]?.providerPaymentId)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Banner if pending */}
        {isPending && !hasPaid && booking.holdExpiresAt && (
          <div className="mb-8 overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50/50 p-6 shadow-lg shadow-orange-500/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 size-5 shrink-0 text-orange-600" />
                <div>
                  <h2 className="text-base font-bold text-neutral-950">Car is Held Exclusively for You</h2>
                  <p className="text-sm text-neutral-600">
                    To guarantee your vehicle, our fleet team is holding this car. Please chat with us on WhatsApp or call
                    to finalize verification and lock in your delivery!
                  </p>
                </div>
              </div>
              <BookingHoldCountdown expiresAt={booking.holdExpiresAt} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Booking Details */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Vehicle Card */}
            <div className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xs font-bold tracking-wider text-neutral-400 uppercase">Selected Vehicle</h2>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {car?.images?.[0]?.url && (
                  <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 sm:w-56">
                    <Image
                      src={car.images[0].url}
                      alt={car.name}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 100vw, 224px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-orange-500/30 bg-orange-500/10 text-orange-600 uppercase font-bold">
                      {car?.brand?.name}
                    </Badge>
                    <Badge className="border-neutral-200 bg-neutral-100 text-neutral-700 font-bold">
                      {car?.year}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-2xl font-black text-neutral-950 tracking-tight">{car?.name}</h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    {car?.brand?.name} {car?.model?.name} · Verified & Sanitized Fleet
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-neutral-700">
                    <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 font-medium">
                      <Users className="size-3.5 text-orange-500" /> 5 Seats
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 font-medium">
                      <Cog className="size-3.5 text-orange-500" /> Manual/Auto
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2 font-medium">
                      <Fuel className="size-3.5 text-orange-500" /> Petrol/Diesel
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Timeline & Locations */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xs font-bold tracking-wider text-neutral-400 uppercase">Rental Schedule & Route</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="relative rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase">
                    <MapPin className="size-4" /> Pickup Point
                  </div>
                  <div className="mt-2 text-base font-bold text-neutral-950">{pickupLocationName}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
                    <Calendar className="size-3.5 text-orange-500" />
                    <span>{formatDate(booking.pickupDateTime)}</span>
                  </div>
                </div>

                <div className="relative rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase">
                    <MapPin className="size-4" /> Drop-off Point
                  </div>
                  <div className="mt-2 text-base font-bold text-neutral-950">{dropLocationName}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600">
                    <Calendar className="size-3.5 text-orange-500" />
                    <span>{formatDate(booking.dropDateTime)}</span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Highlights */}
              <div className="mt-6 border-t border-neutral-200/80 pt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-neutral-700 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-600" /> 100% Comprehensive Insurance
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" /> 300 KM/Day Included
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" /> 24/7 Roadside Assistance
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            {customer && (
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-xs font-bold tracking-wider text-neutral-400 uppercase">Renter Information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Full Name</div>
                    <div className="mt-1 font-bold text-neutral-950">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Phone (WhatsApp)</div>
                    <div className="mt-1 font-bold text-neutral-950">{customer.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-400 font-medium">Email Address</div>
                    <div className="mt-1 font-bold text-neutral-950">{customer.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Actions Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Invoice Card */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl">
              <h2 className="text-sm font-bold text-neutral-950 uppercase tracking-tight">Tariff & Payment Breakdown</h2>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-neutral-700">
                  <span>Base Vehicle Rental</span>
                  <span className="font-semibold text-neutral-950">{formatInr(pricing?.rentalPrice ?? 0)}</span>
                </div>

                {pricing?.extraHourCharge != null && Number(pricing.extraHourCharge) > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Extra Hours</span>
                    <span className="font-semibold text-neutral-950">{formatInr(pricing.extraHourCharge)}</span>
                  </div>
                )}

                {pricing?.extraKmCharge != null && Number(pricing.extraKmCharge) > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Extra Kilometers</span>
                    <span className="font-semibold text-neutral-950">{formatInr(pricing.extraKmCharge)}</span>
                  </div>
                )}

                {(Number(pricing?.airportPickupCharge ?? 0) + Number(pricing?.airportDropCharge ?? 0)) > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Airport Delivery Fee</span>
                    <span className="font-semibold text-neutral-950">{formatInr(Number(pricing?.airportPickupCharge ?? 0) + Number(pricing?.airportDropCharge ?? 0))}</span>
                  </div>
                )}

                {pricing?.locationDropCharge != null && Number(pricing.locationDropCharge) > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Drop Location Fee</span>
                    <span className="font-semibold text-neutral-950">{formatInr(pricing.locationDropCharge)}</span>
                  </div>
                )}

                {pricing?.insuranceCharge != null && Number(pricing.insuranceCharge) > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Protection Plan</span>
                    <span className="font-semibold text-neutral-950">{formatInr(pricing.insuranceCharge)}</span>
                  </div>
                )}

                {pricing?.servicesTotal != null && Number(pricing.servicesTotal) > 0 && (
                  <div className="flex justify-between text-neutral-700">
                    <span>Selected Add-ons</span>
                    <span className="font-semibold text-neutral-950">{formatInr(pricing.servicesTotal)}</span>
                  </div>
                )}

                {pricing?.discount != null && Number(pricing.discount) > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Discount Applied</span>
                    <span>-{formatInr(pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-neutral-200 pt-2 text-neutral-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-700">{formatInr(pricing?.subtotal ?? 0)}</span>
                </div>

                {pricing?.taxAmount != null && Number(pricing.taxAmount) > 0 && (
                  <div className="flex justify-between text-neutral-500">
                    <span>GST (Taxes)</span>
                    <span className="font-medium text-neutral-700">{formatInr(pricing.taxAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-lg font-black text-neutral-950">
                  <span>Total Rental Price</span>
                  <span className="text-orange-600">{formatInr(pricing?.grandTotal ?? 0)}</span>
                </div>

                <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <ShieldCheck className="size-4" /> Refundable Security Deposit
                  </div>
                  <p className="mt-1 text-emerald-800/80 leading-relaxed">
                    A refundable security deposit of ₹3,000–₹5,000 is collected upon car inspection and returned within 24–48 hours after drop-off.
                  </p>
                </div>
              </div>

              {/* Primary Dispatch Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
                {/* Razorpay Online Payment & Verification Action */}
                {isPending && !hasPaid && paymentLinkData?.paymentUrl && (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50/90 p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider">
                      <CreditCard className="size-4 text-orange-600" /> Phone Verification &amp; Payment
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Verify your mobile number via Razorpay OTP and pay online to secure guaranteed car dispatch.
                    </p>
                    <a
                      href={paymentLinkData.paymentUrl}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 py-3 text-center text-sm font-black text-white shadow-lg shadow-orange-500/25 transition-all"
                    >
                      <CreditCard className="size-4" /> Verify Phone &amp; Pay {totalAmountFormatted} →
                    </a>
                    {customer?.phone && (
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                        <Smartphone className="size-3 text-emerald-600" />
                        <span>SMS payment link sent to {customer.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                <a
                  href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500"
                >
                  <MessageSquare className="size-4" /> WhatsApp Us to Finalize
                </a>

                <a
                  href={`tel:${supportPhone.replace(/\s/g, "")}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-center text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                >
                  <Phone className="size-4 text-orange-500" /> Call {supportPhone}
                </a>
              </div>
            </div>

            {/* Next Steps Guide */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl">
              <h3 className="text-xs font-bold tracking-wider text-neutral-400 uppercase">What Happens Next?</h3>
              <ol className="mt-3 flex flex-col gap-3 text-xs text-neutral-700">
                <li className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                    1
                  </span>
                  <span>Our dispatch manager reviews your reservation and calls or messages you on WhatsApp.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                    2
                  </span>
                  <span>Share your Driving License (LMV) and Aadhaar/ID photo for quick 15-minute digital KYC.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                    3
                  </span>
                  <span>Vehicle is detailed, fueled, and handed over at your chosen location or airport gate!</span>
                </li>
              </ol>

              <div className="mt-5 border-t border-neutral-200/80 pt-4">
                <Link
                  href="/cars"
                  className="flex items-center justify-between text-xs font-semibold text-orange-600 hover:text-orange-700"
                >
                  <span>Explore Other Cars</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
