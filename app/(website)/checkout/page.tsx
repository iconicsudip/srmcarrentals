"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  HelpCircle,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  Plane,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  User,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart/cart-store";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      weekday: "short",
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

export default function CheckoutPage() {
  const router = useRouter();
  const { items, count, total, clear } = useCart();

  // Customer Contact State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [flightNotes, setFlightNotes] = React.useState("");

  // Payment method selection: "PICKUP" (Cash / UPI at handover) or "ONLINE"
  const [paymentMethod, setPaymentMethod] = React.useState<"PICKUP" | "ONLINE">("PICKUP");

  // Legal checks
  const [hasLicense, setHasLicense] = React.useState(true);
  const [agreeTerms, setAgreeTerms] = React.useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/40 mb-6">
            <ShoppingBag className="size-10" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">Your Cart is Empty</h1>
          <p className="mt-3 text-sm text-white/50 max-w-md">
            You don&apos;t have any vehicles in your checkout cart yet. Browse our verified self-drive fleet, choose trip dates, and add a vehicle to continue.
          </p>
          <Button asChild className="mt-8 bg-orange-500 hover:bg-orange-600 font-bold px-8 py-3 text-sm rounded-xl">
            <Link href="/cars">Explore Self-Drive Fleet →</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasLicense) {
      toast.error("Original Driving License confirmation is mandatory for self-drive vehicle release.");
      return;
    }
    if (!agreeTerms) {
      toast.error("Please accept the rental policy and terms of service.");
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      toast.error("Please fill in all required customer contact details.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Process bookings for items in the cart
      // For single or primary item, we create the booking and redirect to the voucher
      const primaryItem = items[0];
      if (!primaryItem) throw new Error("No vehicle found in cart.");

      const payload = {
        carId: primaryItem.carId,
        customer: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
        },
        pickupDateTime: new Date(primaryItem.pickup).toISOString(),
        dropDateTime: new Date(primaryItem.drop).toISOString(),
        pickupLocationId: primaryItem.deliveryType === "BRANCH" ? primaryItem.pickupLocationId : undefined,
        dropLocationId: primaryItem.deliveryType === "BRANCH" ? primaryItem.dropLocationId : undefined,
        pickupIsAirport: primaryItem.deliveryType === "AIRPORT",
        dropIsAirport: primaryItem.deliveryType === "AIRPORT",
        pickupAirportId: primaryItem.deliveryType === "AIRPORT" ? primaryItem.pickupAirportId : undefined,
        dropAirportId: primaryItem.deliveryType === "AIRPORT" ? primaryItem.dropAirportId : undefined,
        insuranceId: primaryItem.insurance?.id,
        extraServiceIds: primaryItem.extraServices.map((s) => s.id),
        couponCode: primaryItem.couponCode,
      };

      const result = await apiFetch<{ bookingReference: string }>("/bookings", {
        method: "POST",
        body: payload,
        skipAuthRedirect: true,
      });

      // Clear cart on successful booking reservation
      clear();

      toast.success("Reservation confirmed! 15-minute hold active.");
      router.push(`/booking/${result.bookingReference}`);
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError ? err.message : "Failed to create reservation. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Breadcrumb */}
      <div className="border-b border-white/10 bg-neutral-950/70 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-4 text-xs text-white/50 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/cars" className="hover:text-white">Fleet</Link>
          <ChevronRight className="size-3" />
          <Link href="/cart" className="hover:text-white">Cart</Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-white/90">Checkout</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Title & Trust Seal */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-[10px] font-black tracking-wider text-orange-400 uppercase">
                Secure Reservation
              </span>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <Lock className="size-3" /> 256-Bit SSL Encrypted
              </span>
            </div>
            <h1 className="mt-1 text-3xl font-black text-white tracking-tight uppercase">Checkout & Confirmation</h1>
            <p className="text-xs text-white/50 mt-1">
              Finalize guest contact information and payment preferences to secure vehicle hold.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Free Cancellation
            </span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-orange-400" /> Instant 15-Min Hold
            </span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Checkout Form (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <form onSubmit={handleSubmitCheckout} className="space-y-6">
              {/* SECTION 1: Guest Contact Information */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <User className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">1. Guest Contact Details</h2>
                    <p className="text-[11px] text-white/50">Voucher and trip guidelines will be sent to this WhatsApp and email.</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold text-white/70">First Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Rohan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-1.5 rounded-xl border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-white/70">Last Name *</Label>
                    <Input
                      required
                      placeholder="e.g. Sharma"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-1.5 rounded-xl border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-white/70">WhatsApp Phone Number *</Label>
                    <Input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1.5 rounded-xl border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30"
                    />
                    <p className="mt-1 text-[10px] text-white/40">
                      We send live booking updates, vehicle hold code, and delivery staff contact on WhatsApp.
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-white/70">Email Address (for GST Invoice) *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="rohan@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 rounded-xl border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30"
                    />
                    <p className="mt-1 text-[10px] text-white/40">
                      Official reservation voucher with tax invoice will be sent here.
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="text-xs font-semibold text-white/70">Flight Number / Handover Notes (Optional)</Label>
                  <Input
                    placeholder="e.g. Flight 6E-243 arriving Udaipur 11:30 AM / Need baby seat"
                    value={flightNotes}
                    onChange={(e) => setFlightNotes(e.target.value)}
                    className="mt-1.5 rounded-xl border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30"
                  />
                </div>
              </div>

              {/* SECTION 2: Payment & Reservation Method */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur shadow-xl">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <CreditCard className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">2. Payment & Confirmation Option</h2>
                    <p className="text-[11px] text-white/50">Choose how you prefer to confirm and settle payment.</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Option A: Pay on Pickup (Recommended) */}
                  <label
                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${
                      paymentMethod === "PICKUP"
                        ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === "PICKUP"}
                          onChange={() => setPaymentMethod("PICKUP")}
                          className="accent-orange-500 mt-0.5"
                        />
                        <span className="font-bold text-xs text-white">Pay at Pickup / Handover</span>
                      </div>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Popular
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-white/60">
                      ₹0 upfront charge now. Temporary 15-minute vehicle hold is generated immediately. Pay via UPI, Cash, or Card after inspecting the vehicle.
                    </p>
                  </label>

                  {/* Option B: Online Advance */}
                  <label
                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${
                      paymentMethod === "ONLINE"
                        ? "border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                        : "border-white/10 bg-black/30 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === "ONLINE"}
                          onChange={() => setPaymentMethod("ONLINE")}
                          className="accent-orange-500 mt-0.5"
                        />
                        <span className="font-bold text-xs text-white">Pay Online / UPI / Card</span>
                      </div>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                        Instant
                      </span>
                    </div>

                    <p className="mt-2 text-[11px] text-white/60">
                      Settle payment digitally via Google Pay, PhonePe, Paytm, or NetBanking to guarantee express priority handover.
                    </p>
                  </label>
                </div>
              </div>

              {/* SECTION 3: Driver License Verification & Terms */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">3. Self-Drive Terms & Eligibility</h2>
                    <p className="text-[11px] text-white/50">Standard verification requirements set by Rajasthan RTO and SRM policy.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-white/80 transition hover:bg-black/50">
                    <input
                      type="checkbox"
                      checked={hasLicense}
                      onChange={(e) => setHasLicense(e.target.checked)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span>
                      <strong className="text-white">Original Driving License (LMV):</strong> I hold an original valid Indian Driving License (minimum 1 year old) and will present it alongside Government ID (Aadhaar/Passport) at vehicle handover.
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-white/80 transition hover:bg-black/50">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span>
                      <strong className="text-white">Rental Policy & Safety Limit:</strong> I agree to SRM&apos;s rental agreement, speed limit compliance (80 km/h), and understand that a refundable security deposit (₹3,000–₹5,000) is collected at vehicle pickup.
                    </span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" /> Securing Your Vehicle Hold...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Confirm Reservation (15-Min Hold) • {formatInr(total)} →
                      </span>
                    )}
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-white/40">
                    By clicking Confirm Reservation, your vehicle is locked in the system and an instant booking voucher is created.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-neutral-900/90 p-6 backdrop-blur shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">Order Summary</h3>
                  <span className="text-xs text-white/50">{count} Vehicle{count > 1 ? "s" : ""}</span>
                </div>

                {/* Item List */}
                <div className="divide-y divide-white/10 my-4 max-h-[360px] overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        {item.carImage ? (
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                            <Image
                              src={item.carImage}
                              alt={item.carName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-orange-400">
                            <CarFront className="size-6" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{item.carName}</h4>
                          <span className="inline-block rounded bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-bold text-orange-400 uppercase">
                            {item.rentalMode === "HOURLY" ? "Hourly Rental" : "Daily 24h"}
                          </span>

                          <div className="mt-1 text-[11px] text-white/60 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3 text-orange-400 shrink-0" />
                              <span className="truncate">{formatDate(item.pickup)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="size-3 text-white/40 shrink-0" />
                              <span>{item.durationText}</span>
                            </div>
                            {item.locationName && (
                              <div className="flex items-center gap-1 truncate text-white/50">
                                {item.deliveryType === "AIRPORT" ? (
                                  <Plane className="size-3 text-orange-400 shrink-0" />
                                ) : (
                                  <MapPin className="size-3 text-orange-400 shrink-0" />
                                )}
                                <span className="truncate">{item.locationName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black text-white">{formatInr(item.total)}</div>
                        </div>
                      </div>

                      {/* Add-ons & protection badge */}
                      {(item.insurance || item.extraServices.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-white/50">
                          {item.insurance && (
                            <span className="rounded bg-white/5 px-1.5 py-0.5 border border-white/10 text-emerald-400">
                              ✓ {item.insurance.name}
                            </span>
                          )}
                          {item.extraServices.map((e) => (
                            <span key={e.id} className="rounded bg-white/5 px-1.5 py-0.5 border border-white/10">
                              +{e.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="border-t border-white/10 pt-4 space-y-2 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatInr(items.reduce((sum, item) => sum + item.basePrice, 0))}</span>
                  </div>

                  {items.some((i) => i.discount > 0) && (
                    <div className="flex justify-between font-bold text-emerald-400">
                      <span>Coupon Discount</span>
                      <span>-{formatInr(items.reduce((sum, item) => sum + item.discount, 0))}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-white/50">
                    <span>GST (Taxes 18%)</span>
                    <span>{formatInr(items.reduce((sum, item) => sum + item.tax, 0))}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-black text-white">
                    <span>Total Payable</span>
                    <span className="text-xl text-orange-400">{formatInr(total)}</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300 font-medium">
                    ✓ Refundable Security Deposit: ₹3,000–₹5,000 (at vehicle pickup)
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 text-center">
                  <Link href="/cart" className="text-xs text-white/50 hover:text-white underline">
                    ← Edit Items in Cart
                  </Link>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs space-y-2.5 text-white/60">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Sparkles className="size-4 text-orange-400" /> SRM Quality Guarantees
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Doorstep & Airport Terminal Handover</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Clean, Sanitized & Verified Vehicles</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                  <span>24/7 Roadside Assistance & Breakdown Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
