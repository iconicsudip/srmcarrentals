"use client";

import { includedKmLabel } from "@/lib/cart/trip-breakdown";
import { CarThumb } from "@/components/website/car-thumb";
import { useCopy } from "@/components/copy-provider";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, CarFront, CheckCircle2, ChevronRight, Clock, Fuel, MapPin, MessageSquare, Phone, Receipt, ShieldCheck, ShoppingCart, Sparkles, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart/cart-store";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { CompanyContent } from "@/modules/settings/site-content.schemas";

function formatInr(amount: number | null | undefined) {
  if (amount == null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDmyTime(iso: string) {
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const strHours = String(hours).padStart(2, "0");
    return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
  } catch {
    return iso;
  }
}

interface LocationOption {
  id: string;
  name: string;
  city: string;
  dropCharge: number;
}

export default function CartPage() {
  const t = useCopy();
  const { items, count, removeItem, updateItem } = useCart();
  const [phone, setPhone] = React.useState("+91 9414551250");
  const [whatsapp, setWhatsapp] = React.useState("919414551250");
  const [locations, setLocations] = React.useState<LocationOption[]>([]);
  const [couponCode, setCouponCode] = React.useState("");
  const [, setAppliedCoupon] = React.useState<string | null>(null);

  // Load locations and company settings
  React.useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: any[] }>("/locations?limit=50", { skipAuthRedirect: true })
      .then((res) => {
        if (!cancelled && res?.data) {
          const locs: LocationOption[] = res.data.map((l: any) => ({
            id: l.id,
            name: l.name,
            city: l.city,
            dropCharge: Number(l.dropCharge ?? 0),
          }));
          setLocations(locs);
        }
      })
      .catch(() => {});

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

  const primaryItem = items[0];

  // Delivery drop option selection for primary item
  const selectedLocationId = primaryItem?.dropLocationId || "";
  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const deliveryCharge = Number(primaryItem?.locationDropCharge ?? selectedLocation?.dropCharge ?? 0);

  // Calculations matching customer's screenshot structure
  const subtotal = items.reduce((sum, item) => sum + (item.basePrice || item.dailyPrice || item.total) + (item.extraHourCharge ?? 0), 0);
  const refundableDeposit = primaryItem?.securityDeposit ?? 5000;
  const freeKmsLabel = primaryItem ? includedKmLabel(primaryItem) : "240km";
  const extraKmRate = primaryItem?.extraKmPrice ?? 10;
  const fuelType = primaryItem?.fuelType ?? "Diesel";

  // Total payable: subtotal + delivery + refundable deposit
  const grandTotal = subtotal + deliveryCharge + refundableDeposit;

  // Handle dropdown change for drop location
  const handleLocationChange = (locationId: string) => {
    if (!primaryItem) return;

    if (!locationId) {
      const prevFee = primaryItem.locationDropCharge ?? 0;
      updateItem(primaryItem.id, {
        dropLocationId: undefined,
        locationDropCharge: 0,
        total: Math.max(0, primaryItem.total - prevFee),
      });
      toast.info("Drop location reset to Standard Branch.");
      return;
    }

    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;

    const newFee = loc.dropCharge;
    const prevFee = primaryItem.locationDropCharge ?? 0;
    const diff = newFee - prevFee;

    updateItem(primaryItem.id, {
      dropLocationId: loc.id,
      locationDropCharge: newFee,
      total: Math.max(0, primaryItem.total + diff),
      locationName: primaryItem.locationName?.includes("→")
        ? `${primaryItem.locationName.split("→")[0]?.trim()} → ${loc.name}`
        : `${primaryItem.locationName || "Udaipur"} → ${loc.name}`,
    });

    toast.success(`Selected ${loc.name} (${newFee > 0 ? `+₹${newFee}` : "Free"})`);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setAppliedCoupon(couponCode.trim().toUpperCase());
    toast.success(`Coupon code ${couponCode.trim().toUpperCase()} applied!`);
  };

  const handleUpdateCart = () => {
    toast.success("Cart updated successfully!");
  };

  const whatsappNumber = whatsapp || phone.replace(/[^0-9]/g, "");
  const whatsappText = encodeURIComponent(
    `Hello SRM Car Rentals,\n\nI want to confirm my booking from the website cart:\n\n` +
      items
        .map(
          (item, i) =>
            `${i + 1}. *${item.carName}*\n` +
            `   • Pickup: ${formatDmyTime(item.pickup)}\n` +
            `   • Return: ${formatDmyTime(item.drop)}\n` +
            `   • Handover: ${item.locationName || "Udaipur"}\n` +
            (item.locationDropCharge ? `   • Delivery Fee: ₹${item.locationDropCharge}\n` : "") +
            `   • Item Total: ₹${item.total.toLocaleString("en-IN")}\n`,
        )
        .join("\n") +
      `\n*Total Payable:* ₹${grandTotal.toLocaleString("en-IN")}\n\nPlease confirm availability!`,
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900 selection:bg-orange-500 selection:text-white">
      {/* Top Breadcrumb */}
      <div className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-md py-3">
        <div className="mx-auto flex max-w-[1520px] items-center gap-1.5 px-4 text-xs text-neutral-500 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-orange-600 transition">
            {t("cart.home")}
          </Link>
          <ChevronRight className="size-3 text-neutral-300" />
          <Link href="/cars" className="hover:text-orange-600 transition">
            {t("cart.self-drive-fleet")}
          </Link>
          <ChevronRight className="size-3 text-neutral-300" />
          <span className="font-semibold text-orange-600">Cart ({count})</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border border-neutral-200/90 bg-white shadow-sm">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 mb-5 shadow-inner">
              <CarFront className="size-10 stroke-[1.5]" />
            </div>
            <h2 className="text-2xl font-black text-neutral-950 uppercase tracking-tight">{t("cart.your-cart-is-empty")}</h2>
            <p className="mt-2 text-sm text-neutral-500 max-w-md">
              {t("cart.explore-our-verified-premium")}
            </p>
            <Button asChild className="mt-6 rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600 shadow-lg shadow-orange-500/25 px-6 py-2.5">
              <Link href="/cars">{t("cart.explore-fleet")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
            
            {/* ── LEFT COLUMN: Product Table & Schedule Details (7-8 cols) ── */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-sm">
                
                {/* Table Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 border-b border-neutral-200 bg-neutral-50 px-6 py-4 text-xs font-black uppercase tracking-wider text-neutral-600">
                  <div className="col-span-6">{t("cart.product-rental-schedule")}</div>
                  <div className="col-span-2 text-center">{t("cart.price")}</div>
                  <div className="col-span-2 text-center">{t("cart.quantity")}</div>
                  <div className="col-span-2 text-right">{t("cart.total")}</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-neutral-200">
                  {items.map((item) => {
                    const city =
                      item.city ||
                      (item.locationName?.includes("(")
                        ? item.locationName.split("(")[1]?.replace(")", "").trim()
                        : "Kalwar Road");

                    return (
                      <div
                        key={item.id}
                        className="p-5 sm:p-6 transition-colors hover:bg-neutral-50/50"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-start">
                          
                          {/* Col 1: Product details */}
                          <div className="sm:col-span-6 flex items-start gap-4">
                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg border border-red-500/20 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition active:scale-95 cursor-pointer"
                              title={t("cart.remove-car-from-cart")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>

                            {/* Car Thumbnail */}
                            <CarThumb src={item.carImage} name={item.carName} className="size-20 sm:size-24 rounded-2xl" sizes="96px" />

                            {/* Name & Structured Metadata */}
                            <div className="min-w-0 flex-1 space-y-2">
                              <div>
                                <h3 className="text-base font-bold text-neutral-950 tracking-tight leading-snug">
                                  {item.carSlug ? (
                                    <Link href={`/car/${item.carSlug}`} className="hover:text-orange-600 transition">
                                      {item.carName}
                                    </Link>
                                  ) : (
                                    item.carName
                                  )}
                                </h3>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                                    <Fuel className="size-2.5 text-orange-500" />
                                    {item.fuelType || "Diesel"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                                    <MapPin className="size-2.5 text-orange-500" />
                                    {city}
                                  </span>
                                </div>
                              </div>

                              {/* Dates & Schedule Grid */}
                              <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-2.5 text-[11px] space-y-1.5 text-neutral-700">
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-500 flex items-center gap-1">
                                    <Calendar className="size-3 text-orange-500" /> {t("cart.pickup-date-time")}
                                  </span>
                                  <span className="font-semibold text-neutral-900">{formatDmyTime(item.pickup)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-neutral-500 flex items-center gap-1">
                                    <Clock className="size-3 text-orange-500" /> {t("cart.return-date-time")}
                                  </span>
                                  <span className="font-semibold text-neutral-900">{formatDmyTime(item.drop)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-neutral-200 text-[10px]">
                                  <span className="text-neutral-500">{t("cart.pickup-location")}</span>
                                  <span className="text-neutral-800 truncate max-w-[160px] text-right">
                                    {item.locationName?.split("→")[0]?.trim() || city}
                                  </span>
                                </div>
                                {selectedLocation && (
                                  <div className="flex items-center justify-between text-[10px] text-orange-600 font-medium">
                                    <span>{t("cart.drop-location")}</span>
                                    <span className="text-right">
                                      {selectedLocation.name}
                                      {selectedLocation.dropCharge > 0 ? ` (+₹${selectedLocation.dropCharge})` : " (Free)"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Price (desktop) */}
                          <div className="sm:col-span-2 sm:text-center text-sm font-semibold text-neutral-800 sm:pt-2 flex justify-between sm:block">
                            <span className="sm:hidden text-neutral-500 text-xs font-normal">{t("cart.price-2")}</span>
                            <span>{formatInr(item.basePrice || item.dailyPrice)}</span>
                            {(item.extraHours ?? 0) > 0 && (
                              <span className="block text-[11px] font-normal text-neutral-500">
                                + {item.extraHours} hr{item.extraHours === 1 ? "" : "s"} × {formatInr(item.extraHourPrice ?? 0)}
                              </span>
                            )}
                          </div>

                          {/* Col 3: Quantity / Duration */}
                          <div className="sm:col-span-2 sm:text-center text-sm font-medium text-neutral-700 sm:pt-2 flex justify-between sm:block">
                            <span className="sm:hidden text-neutral-500 text-xs font-normal">{t("cart.quantity-2")}</span>
                            <span className="inline-block rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-600">
                              {item.durationHours || 24} Hours
                            </span>
                          </div>

                          {/* Col 4: Line Total */}
                          <div className="sm:col-span-2 sm:text-right text-base font-black text-neutral-950 sm:pt-2 flex justify-between sm:block border-t sm:border-0 border-neutral-100 pt-2">
                            <span className="sm:hidden text-neutral-500 text-xs font-normal">{t("cart.total-2")}</span>
                            <span className="text-orange-600 sm:text-neutral-950">
                              {formatInr((item.basePrice || item.dailyPrice) + (item.extraHourCharge ?? 0))}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code & Update Action Footer */}
                <div className="border-t border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
                  <form onSubmit={handleApplyCoupon} className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[220px] flex-1">
                      <div className="relative">
                        <Tag className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                        <input
                          type="text"
                          placeholder={t("cart.coupon-code")}
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-orange-500 shadow-sm"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="h-11 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer"
                    >
                      {t("cart.apply-coupon")}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUpdateCart}
                      variant="outline"
                      className="h-11 rounded-xl border-neutral-200 bg-white hover:border-orange-500 hover:text-orange-600 px-5 text-xs font-bold text-neutral-800 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      {t("cart.update-cart")}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Booking Perks & Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-200/90 bg-white p-3.5 text-xs text-neutral-700 shadow-sm">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>{t("cart.100-refundable-security-deposit")}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-200/90 bg-white p-3.5 text-xs text-neutral-700 shadow-sm">
                  <Sparkles className="size-4 text-orange-500 shrink-0" />
                  <span>{t("cart.cleaned-sanitized-insured")}</span>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl border border-neutral-200/90 bg-white p-3.5 text-xs text-neutral-700 shadow-sm">
                  <CheckCircle2 className="size-4 text-sky-600 shrink-0" />
                  <span>{t("cart.zero-hidden-charges-at")}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Cart Totals Card (4-5 cols) ── */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-7 shadow-xl space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
                      <Receipt className="size-4" />
                    </span>
                    <h2 className="text-lg font-black text-neutral-950 uppercase tracking-tight">{t("cart.cart-totals")}</h2>
                  </div>
                  <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600">
                    {count} Car{count > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Breakdown Rows */}
                <div className="divide-y divide-neutral-100 text-xs">
                  
                  {/* Subtotal */}
                  <div className="flex items-center justify-between py-3 text-neutral-600">
                    <span className="font-semibold text-neutral-900">{t("cart.subtotal")}</span>
                    <span className="font-bold text-neutral-950 text-sm">{formatInr(subtotal)}</span>
                  </div>

                  {/* Free Kms */}
                  <div className="flex items-center justify-between py-3 text-neutral-600">
                    <span className="font-semibold text-neutral-900">{t("cart.free-kms")}</span>
                    <span className="text-right font-medium text-neutral-800">
                      {freeKmsLabel}
                    </span>
                  </div>

                  {/* Doorstep Delivery & Pickup Dropdown */}
                  <div className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900">{t("cart.doorstep-delivery-pickup")}</span>
                      {deliveryCharge > 0 ? (
                        <span className="text-[11px] font-bold text-orange-600">+{formatInr(deliveryCharge)}</span>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600">{t("cart.included")}</span>
                      )}
                    </div>
                    <div className="relative">
                      <select
                        id="cart-totals-delivery-location-select"
                        value={selectedLocationId}
                        onChange={(e) => handleLocationChange(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 pr-8 text-xs font-semibold text-neutral-900 outline-none transition hover:border-orange-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-sm"
                      >
                        <option value="" className="bg-white text-neutral-900">Standard Branch Pickup (Free)</option>
                        {locations.map((loc) => {
                          const charge = loc.dropCharge;
                          const priceText = charge > 0 ? ` - ₹${charge}` : " - Free";
                          return (
                            <option key={loc.id} value={loc.id} className="bg-white text-neutral-900">
                              {loc.name}{priceText}
                            </option>
                          );
                        })}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[10px]">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Refundable Deposit */}
                  <div className="flex items-center justify-between py-3 text-neutral-600">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-neutral-900">{t("cart.refundable-deposit")}</span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-500/30">
                        {t("cart.100-refundable")}
                      </span>
                    </div>
                    <span className="font-bold text-neutral-950">{formatInr(refundableDeposit)}</span>
                  </div>

                  {/* Grand Total */}
                  <div className="flex items-center justify-between py-4 border-t border-neutral-200">
                    <div>
                      <span className="text-sm font-bold text-neutral-950 uppercase tracking-wider block">{t("cart.total-3")}</span>
                      <span className="text-[10px] text-neutral-400">{t("cart.includes-all-taxes-deposit")}</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-orange-600 tracking-tight">
                      {formatInr(grandTotal)}
                    </span>
                  </div>

                  {/* Fuel Policy */}
                  <div className="flex items-center justify-between py-2.5 text-neutral-600">
                    <span className="font-medium text-neutral-800">{t("cart.fuel")}</span>
                    <span className="font-semibold text-neutral-950">{fuelType}</span>
                  </div>

                  {/* Extra Kms Charge */}
                  <div className="flex items-center justify-between py-2.5 text-neutral-600">
                    <span className="font-medium text-neutral-800">{t("cart.extra-kms-charge")}</span>
                    <span className="font-semibold text-neutral-950">₹{extraKmRate}.00 / km</span>
                  </div>
                </div>

                {/* Primary CTA: Proceed to Checkout */}
                <div className="pt-2">
                  <Button
                    asChild
                    className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-black uppercase tracking-wider text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:shadow-orange-500/40 active:scale-[0.98] cursor-pointer"
                  >
                    <Link href="/checkout" className="flex items-center justify-center gap-2">
                      <ShoppingCart className="size-4" /> {t("cart.proceed-to-checkout")}
                    </Link>
                  </Button>
                </div>

                {/* Secondary Actions: WhatsApp & Phone Support */}
                <div className="pt-1 flex flex-col gap-2">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-xs font-bold text-white transition active:scale-95 shadow-md shadow-emerald-600/20"
                  >
                    <MessageSquare className="size-3.5" /> {t("cart.book-via-whatsapp")}
                  </a>
                  <a
                    href={`tel:${phone.replace(/[^0-9]/g, "")}`}
                    className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white hover:border-orange-500 hover:text-orange-600 text-xs font-semibold text-neutral-700 transition shadow-sm"
                  >
                    <Phone className="size-3 text-orange-500" /> Call Support ({phone})
                  </a>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
