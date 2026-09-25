import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Printer,
  ShieldCheck,
  Users,
  Fuel,
  Cog,
  ArrowRight,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getPublicBookingByReference } from "@/modules/bookings/bookings.service";
import { getCompanyContent } from "@/modules/website/public-content.service";
import { BookingHoldCountdown } from "@/components/website/booking-hold-countdown";

interface BookingConfirmationPageProps {
  params: Promise<{ reference: string }>;
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

export default async function BookingConfirmationPage({ params }: BookingConfirmationPageProps) {
  const { reference } = await params;

  let booking;
  try {
    booking = await getPublicBookingByReference(reference);
  } catch {
    notFound();
  }

  if (!booking) notFound();

  const company = await getCompanyContent();
  const supportPhone = company?.phone || "+91 9414551250";
  const car = booking.car;
  const pricing = booking.pricingSnapshot;
  const customer = booking.customer;
  const isPending = booking.status === "PENDING" || booking.status === "PAYMENT_PENDING";

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
    <div className="min-h-screen bg-black text-white">
      {/* Header Banner */}
      <div className="border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30">
                <CheckCircle2 className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                    {isPending ? "15-Minute Temporary Hold Active" : "Booking Confirmed"}
                  </span>
                  <Badge className="border-white/10 bg-white/5 text-white/70">Ref: {booking.bookingReference}</Badge>
                </div>
                <h1 className="text-2xl font-black text-white sm:text-3xl">Reservation Received!</h1>
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
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
              >
                <Phone className="size-4 text-orange-500" /> Call {company.phone}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Countdown Banner if pending */}
        {isPending && booking.holdExpiresAt && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-neutral-900 to-neutral-900 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <Clock className="mt-1 size-5 shrink-0 text-orange-400" />
                <div>
                  <h2 className="text-base font-bold text-white">Car is Held Exclusively for You</h2>
                  <p className="text-sm text-white/60">
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
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur">
              <h2 className="mb-4 text-xs font-bold tracking-wider text-white/40 uppercase">Selected Vehicle</h2>
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                {car?.images?.[0]?.url && (
                  <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:w-56">
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
                    <Badge className="border-orange-500/30 bg-orange-500/10 text-orange-400 uppercase">
                      {car?.brand?.name}
                    </Badge>
                    <Badge className="border-white/10 bg-white/5 text-white/70">
                      {car?.year}
                    </Badge>
                  </div>
                  <h3 className="mt-2 text-2xl font-bold text-white">{car?.name}</h3>
                  <p className="mt-1 text-sm text-white/50">
                    {car?.brand?.name} {car?.model?.name} · Verified & Sanitized Fleet
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-white/70">
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 p-2">
                      <Users className="size-3.5 text-orange-400" /> 5 Seats
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 p-2">
                      <Cog className="size-3.5 text-orange-400" /> Manual/Auto
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 p-2">
                      <Fuel className="size-3.5 text-orange-400" /> Petrol/Diesel
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Timeline & Locations */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur">
              <h2 className="mb-4 text-xs font-bold tracking-wider text-white/40 uppercase">Rental Schedule & Route</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="relative rounded-xl border border-white/10 bg-black/40 p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase">
                    <MapPin className="size-4" /> Pickup Point
                  </div>
                  <div className="mt-2 text-base font-bold text-white">{pickupLocationName}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <Calendar className="size-3.5 text-orange-400" />
                    <span>{formatDate(booking.pickupDateTime)}</span>
                  </div>
                </div>

                <div className="relative rounded-xl border border-white/10 bg-black/40 p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase">
                    <MapPin className="size-4" /> Drop-off Point
                  </div>
                  <div className="mt-2 text-base font-bold text-white">{dropLocationName}</div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <Calendar className="size-3.5 text-orange-400" />
                    <span>{formatDate(booking.dropDateTime)}</span>
                  </div>
                </div>
              </div>

              {/* Inclusions & Highlights */}
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs text-white/70">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400" /> 100% Comprehensive Insurance
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" /> 300 KM/Day Included
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" /> 24/7 Roadside Assistance
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            {customer && (
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur">
                <h2 className="mb-4 text-xs font-bold tracking-wider text-white/40 uppercase">Renter Information</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
                  <div>
                    <div className="text-xs text-white/40">Full Name</div>
                    <div className="mt-1 font-semibold text-white">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Phone (WhatsApp)</div>
                    <div className="mt-1 font-semibold text-white">{customer.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/40">Email Address</div>
                    <div className="mt-1 font-semibold text-white">{customer.email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing & Actions Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Invoice Card */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur">
              <h2 className="text-sm font-bold text-white">Tariff & Payment Breakdown</h2>

              <div className="mt-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Base Vehicle Rental</span>
                  <span>{formatInr(pricing?.rentalPrice ?? 0)}</span>
                </div>

                {pricing?.extraHourCharge != null && Number(pricing.extraHourCharge) > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Extra Hours</span>
                    <span>{formatInr(pricing.extraHourCharge)}</span>
                  </div>
                )}

                {pricing?.extraKmCharge != null && Number(pricing.extraKmCharge) > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Extra Kilometers</span>
                    <span>{formatInr(pricing.extraKmCharge)}</span>
                  </div>
                )}

                {(Number(pricing?.airportPickupCharge ?? 0) + Number(pricing?.airportDropCharge ?? 0)) > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Airport Delivery Fee</span>
                    <span>{formatInr(Number(pricing?.airportPickupCharge ?? 0) + Number(pricing?.airportDropCharge ?? 0))}</span>
                  </div>
                )}

                {pricing?.insuranceCharge != null && Number(pricing.insuranceCharge) > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Protection Plan</span>
                    <span>{formatInr(pricing.insuranceCharge)}</span>
                  </div>
                )}

                {pricing?.servicesTotal != null && Number(pricing.servicesTotal) > 0 && (
                  <div className="flex justify-between text-white/70">
                    <span>Selected Add-ons</span>
                    <span>{formatInr(pricing.servicesTotal)}</span>
                  </div>
                )}

                {pricing?.discount != null && Number(pricing.discount) > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-400">
                    <span>Discount Applied</span>
                    <span>-{formatInr(pricing.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-white/10 pt-2 text-white/50">
                  <span>Subtotal</span>
                  <span>{formatInr(pricing?.subtotal ?? 0)}</span>
                </div>

                {pricing?.taxAmount != null && Number(pricing.taxAmount) > 0 && (
                  <div className="flex justify-between text-white/50">
                    <span>GST (Taxes)</span>
                    <span>{formatInr(pricing.taxAmount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-lg font-black text-white">
                  <span>Total Rental Price</span>
                  <span className="text-orange-400">{formatInr(pricing?.grandTotal ?? 0)}</span>
                </div>

                <div className="mt-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="size-4" /> Refundable Security Deposit
                  </div>
                  <p className="mt-1 text-white/60">
                    A refundable security deposit of ₹3,000–₹5,000 is collected upon car inspection and returned within 24–48 hours after drop-off.
                  </p>
                </div>
              </div>

              {/* Primary Dispatch Buttons */}
              <div className="mt-6 flex flex-col gap-2.5">
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-center text-sm font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="size-4 text-orange-400" /> Call {supportPhone}
                </a>
              </div>
            </div>

            {/* Next Steps Guide */}
            <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 backdrop-blur">
              <h3 className="text-xs font-bold tracking-wider text-white/40 uppercase">What Happens Next?</h3>
              <ol className="mt-3 flex flex-col gap-3 text-xs text-white/70">
                <li className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 font-bold text-orange-400">
                    1
                  </span>
                  <span>Our dispatch manager reviews your reservation and calls or messages you on WhatsApp.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 font-bold text-orange-400">
                    2
                  </span>
                  <span>Share your Driving License (LMV) and Aadhaar/ID photo for quick 15-minute digital KYC.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500/20 font-bold text-orange-400">
                    3
                  </span>
                  <span>Vehicle is detailed, fueled, and handed over at your chosen location or airport gate!</span>
                </li>
              </ol>

              <div className="mt-5 border-t border-white/10 pt-4">
                <Link
                  href="/cars"
                  className="flex items-center justify-between text-xs font-semibold text-orange-400 hover:text-orange-300"
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
