"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  CarFront,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { useCart } from "@/lib/cart/cart-store";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { CompanyContent } from "@/modules/settings/site-content.schemas";

function formatInr(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export default function CartPage() {
  const { items, count, total, removeItem, clear } = useCart();
  const [phone, setPhone] = React.useState("+91 9414551250");
  const [whatsapp, setWhatsapp] = React.useState("919414551250");

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<CompanyContent>("/settings/homepage.company", { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled && data) {
          if (data.phone) setPhone(data.phone);
          if (data.socialLinks?.whatsapp) {
            setWhatsapp(data.socialLinks.whatsapp.replace(/[^0-9]/g, ""));
          } else if (data.phone) {
            setWhatsapp(data.phone.replace(/[^0-9]/g, ""));
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsappNumber = whatsapp || phone.replace(/[^0-9]/g, "");

  const whatsappText = encodeURIComponent(
    `Hello SRM Car Rentals,\n\nI want to confirm my booking from the website cart:\n\n` +
    items
      .map(
        (item, i) =>
          `${i + 1}. *${item.carName}*\n` +
          `   • Mode: ${item.rentalMode === "HOURLY" ? "Hourly Rental" : "Daily 24h"}\n` +
          `   • Dates: ${formatDate(item.pickup)} to ${formatDate(item.drop)} (${item.durationText})\n` +
          `   • Handover: ${item.locationName}\n` +
          (item.insurance ? `   • Protection: ${item.insurance.name} (₹${item.insurance.price})\n` : "") +
          (item.extraServices.length > 0
            ? `   • Add-ons: ${item.extraServices.map((a) => a.name).join(", ")}\n`
            : "") +
          `   • Item Total: ₹${item.total.toLocaleString("en-IN")}\n`,
      )
      .join("\n") +
    `\n*Total Payable:* ₹${total.toLocaleString("en-IN")}\n\nPlease share booking confirmation & payment details!`,
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Breadcrumb */}
      <div className="border-b border-white/10 bg-neutral-950/60 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 text-xs text-white/50 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/cars" className="hover:text-white">Self Drive Fleet</Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-white/90">Cart ({count})</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Your Reservation Cart</h1>
            <p className="mt-1 text-sm text-white/50">
              Review your selected cars and trip schedules before instant confirmation.
            </p>
          </div>

          {count > 0 && (
            <button
              type="button"
              onClick={clear}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/60 hover:border-red-500/40 hover:text-red-400 transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="size-16 text-white/20 mb-4 stroke-[1.5]" />
            <h2 className="text-xl font-bold text-white">Your cart is currently empty</h2>
            <p className="mt-2 text-sm text-white/50 max-w-md">
              No vehicles have been added yet. Choose your favorite car, select trip dates, and add it to cart.
            </p>
            <Button asChild className="mt-6 bg-orange-500 font-bold text-white hover:bg-orange-600">
              <Link href="/cars">Explore Fleet →</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Cart Items List */}
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-white/10 bg-neutral-900/70 p-6 backdrop-blur transition hover:border-orange-500/30"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-black tracking-wider text-orange-400 uppercase">
                          {item.rentalMode === "HOURLY" ? "Hourly Rental" : "24h Daily Rental"}
                        </span>
                        {item.carSlug ? (
                          <Link href={`/car/${item.carSlug}`} className="text-xl font-black text-white hover:text-orange-400 transition">
                            {item.carName}
                          </Link>
                        ) : (
                          <h3 className="text-xl font-black text-white">{item.carName}</h3>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-orange-400 shrink-0" />
                          <span>Pickup: <strong className="text-white">{formatDate(item.pickup)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-orange-400 shrink-0" />
                          <span>Drop: <strong className="text-white">{formatDate(item.drop)}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-orange-400 shrink-0" />
                          <span>Duration: <strong className="text-white">{item.durationText}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-orange-400 shrink-0" />
                          <span className="truncate">Handover: <strong className="text-white">{item.locationName}</strong></span>
                        </div>
                      </div>

                      {/* Protection & Addons */}
                      {(item.insurance || item.extraServices.length > 0) && (
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                          {item.insurance && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
                              <ShieldCheck className="size-3.5 text-emerald-400" />
                              {item.insurance.name} ({formatInr(item.insurance.price)})
                            </span>
                          )}
                          {item.extraServices.map((a) => (
                            <span
                              key={a.id}
                              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80"
                            >
                              +{a.name} ({formatInr(a.price)})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-400">{formatInr(item.total)}</div>
                        <div className="text-[11px] text-white/40">Includes taxes & add-ons</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50 hover:border-red-500/40 hover:text-red-400 transition"
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary */}
            <div className="rounded-3xl border border-white/10 bg-neutral-900/90 p-6 backdrop-blur-xl h-fit">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Cart Summary</h2>

              <div className="mt-4 flex flex-col gap-2.5 text-xs text-white/70 border-b border-white/10 pb-4">
                <div className="flex justify-between">
                  <span>Vehicles ({count})</span>
                  <span>{formatInr(total)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Instant Verification</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Free Cancellation</span>
                  <span>Up to 48h</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-lg font-black text-white">
                <span>Total Payable</span>
                <span className="text-2xl text-orange-400">{formatInr(total)}</span>
              </div>

              <p className="mt-2 text-[11px] text-emerald-400 font-medium">
                ✓ 100% Refundable Security Deposit ₹3,000–₹5,000 (collected at pickup)
              </p>

              {/* Direct Booking Actions */}
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  asChild
                  className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition active:scale-[0.98]"
                >
                  <Link href="/checkout" className="flex items-center justify-center gap-2">
                    Proceed to Checkout • {formatInr(total)} →
                  </Link>
                </Button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-95"
                >
                  <MessageSquare className="size-4" /> Book Instantly via WhatsApp
                </a>

                <a
                  href={`tel:${phone.replace(/[^0-9]/g, "")}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 py-2.5 text-xs font-semibold text-white transition"
                >
                  <Phone className="size-3.5 text-orange-400" /> Confirm via Call ({phone})
                </a>
              </div>

              <div className="mt-4 text-center">
                <Link href="/cars" className="text-xs text-white/40 hover:text-white underline">
                  ← Add more cars from fleet
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
