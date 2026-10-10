"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CarFront,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useCart } from "@/lib/cart/cart-store";
import { Button } from "@/components/ui/button";

function formatInr(amount: number | undefined | null) {
  const safe = Number.isFinite(amount) ? (amount as number) : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(safe);
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function CartDrawer({ phone = "+91 9414551250" }: { phone?: string }) {
  const router = useRouter();
  const { items, count, total, isDrawerOpen, closeCart, removeItem, clear } = useCart();
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleProceedCheckout = () => {
    setIsCheckingOut(true);
    closeCart();
    router.push("/checkout");
  };

  const handleDeleteItem = (id: string) => {
    setDeletingId(id);
    setTimeout(() => {
      removeItem(id);
      setDeletingId(null);
    }, 200);
  };

  // Escape key closes drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    if (isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen, closeCart]);

  if (!isDrawerOpen) return null;

  // Build WhatsApp booking link with pre-filled message
  const whatsappNumber = phone.replace(/[^0-9]/g, "");
  const whatsappText = encodeURIComponent(
    `Hello SRM Car Rentals,\n\nI want to confirm my booking from the website:\n\n` +
      items
        .map(
          (item, i) =>
            `${i + 1}. *${item.carName}*\n` +
            `   • Mode: ${item.rentalMode === "HOURLY" ? "Hourly Rental" : "Daily 24h"}\n` +
            `   • Dates: ${formatDate(item.pickup)} to ${formatDate(item.drop)} (${item.durationText})\n` +
            `   • Handover: ${item.locationName}\n` +
            (item.insurance ? `   • Protection: ${item.insurance.name} (₹${item.insurance.price})\n` : "") +
            ((item.extraServices?.length ?? 0) > 0
              ? `   • Add-ons: ${item.extraServices?.map((a) => a.name).join(", ")}\n`
              : "") +
            `   • Item Total: ₹${(item.total ?? 0).toLocaleString("en-IN")}\n`,
        )
        .join("\n") +
      `\n*Total Payable:* ₹${(total ?? 0).toLocaleString("en-IN")}\n\nPlease share handover steps & confirmation!`,
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Content */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white p-6 shadow-2xl overflow-hidden text-neutral-900">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-neutral-150 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 shadow-xs">
              <ShoppingBag className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-neutral-950 uppercase tracking-tight">Your Cart</h2>
              <p className="text-[11px] text-neutral-500 font-medium">
                {count === 0 ? "No cars selected" : `${count} vehicle${count > 1 ? "s" : ""} selected`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {count > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-xs text-neutral-400 hover:text-red-500 transition cursor-pointer font-medium"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={closeCart}
              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Drawer Items */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3.5 divide-y divide-neutral-150">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-neutral-500">
              <CarFront className="size-16 text-neutral-300 mb-3 stroke-[1.5]" />
              <h3 className="text-sm font-bold text-neutral-950">Your cart is empty</h3>
              <p className="mt-1 text-xs text-neutral-500 max-w-[220px]">
                Browse our fleet of self-drive hatchbacks, sedans, and SUVs to add a car.
              </p>
              <Button asChild onClick={closeCart} className="mt-4 bg-orange-500 text-white font-bold shadow-md shadow-orange-500/25 hover:bg-orange-600">
                <Link href="/cars">Explore Fleet →</Link>
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="pt-3.5 first:pt-0 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-black text-orange-700 uppercase">
                        {item.rentalMode === "HOURLY" ? "Hourly" : "24h Daily"}
                      </span>
                      {item.carSlug ? (
                        <Link
                          href={`/car/${item.carSlug}`}
                          onClick={closeCart}
                          className="font-black text-sm text-neutral-950 hover:text-orange-600 transition"
                        >
                          {item.carName}
                        </Link>
                      ) : (
                        <span className="font-black text-sm text-neutral-950">{item.carName}</span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-col gap-1 text-[11px] text-neutral-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3 text-orange-500 shrink-0" />
                        <span>
                          {formatDate(item.pickup)} → {formatDate(item.drop)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="size-3 text-orange-500 shrink-0" />
                        <span className="font-bold text-neutral-900">{item.durationText}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3 text-orange-500 shrink-0" />
                        <span className="truncate max-w-[220px]">{item.locationName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-sm font-black text-neutral-950">{formatInr(item.total)}</span>
                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-neutral-400 hover:text-red-500 transition p-1 cursor-pointer disabled:opacity-50"
                      title="Remove item"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Protection / Addons pill */}
                {(item.insurance || (item.extraServices?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-neutral-600 pt-1">
                    {item.insurance && (
                      <span className="inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 border border-neutral-200">
                        <ShieldCheck className="size-2.5 text-emerald-600" />
                        {item.insurance.name}
                      </span>
                    )}
                    {item.extraServices?.map((a) => (
                      <span
                        key={a.id}
                        className="rounded bg-neutral-100 px-1.5 py-0.5 border border-neutral-200"
                      >
                        +{a.name}
                      </span>
                    ))}
                    {(item.locationDropCharge ?? 0) > 0 && (
                      <span className="rounded bg-orange-500/10 px-1.5 py-0.5 border border-orange-500/20 text-orange-700">
                        +₹{Number(item.locationDropCharge).toLocaleString("en-IN")} Drop Fee
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="border-t border-neutral-150 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-600">
              <span>Vehicles ({count})</span>
              <span className="font-semibold text-neutral-900">{formatInr(total)}</span>
            </div>

            <div className="flex items-center justify-between text-base font-black text-neutral-950">
              <span>Total Payable</span>
              <span className="text-lg text-orange-600">{formatInr(total)}</span>
            </div>

            <div className="text-[11px] text-emerald-700 font-semibold">
              ✓ Refundable Security Deposit ₹3,000–₹5,000 (at pickup)
            </div>

            {/* Proceed to Checkout CTA */}
            <Button
              type="button"
              onClick={handleProceedCheckout}
              disabled={isCheckingOut}
              className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 py-3.5 text-sm font-black text-white shadow-xl shadow-orange-500/25 transition active:scale-[0.98] cursor-pointer"
            >
              {isCheckingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Preparing Checkout...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Proceed to Checkout • {formatInr(total)} →
                </span>
              )}
            </Button>

            {/* Direct WhatsApp Confirmation Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              <MessageSquare className="size-4" /> Instant Book via WhatsApp
            </a>

            {/* View Full Cart Page Button */}
            <Button
              asChild
              variant="outline"
              onClick={closeCart}
              className="w-full border-neutral-200 bg-neutral-50 text-xs text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950"
            >
              <Link href="/cart">View Full Cart Details</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
