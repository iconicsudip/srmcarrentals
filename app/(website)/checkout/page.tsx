"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  User,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart/cart-store";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { useCurrentUser, useLogin, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

function formatInr(amount: number | null | undefined) {
  const safe = Number.isFinite(amount) ? (amount as number) : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
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
  const { items, total, clear, updateItem } = useCart();

  // Locations for delivery drop charges
  interface LocationOption {
    id: string;
    name: string;
    city: string;
    dropCharge: number;
  }
  const [locations, setLocations] = React.useState<LocationOption[]>([]);
  const [isChangingLocation, setIsChangingLocation] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: any[] }>("/locations?limit=50", { skipAuthRedirect: true })
      .then((res) => {
        if (!cancelled && res?.data) {
          setLocations(
            res.data.map((l: any) => ({
              id: l.id,
              name: l.name,
              city: l.city,
              dropCharge: Number(l.dropCharge ?? 0),
            }))
          );
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryItem = items[0];

  // Delivery location & charges
  const selectedLocation = locations.find((l) => l.id === primaryItem?.dropLocationId);
  const deliveryLocationName =
    selectedLocation?.name ||
    (primaryItem?.locationName?.includes("→")
      ? primaryItem.locationName.split("→")[1]?.trim()
      : primaryItem?.locationName) ||
    "Udaipur Railway Station";

  const deliveryCharge = Number(
    primaryItem?.locationDropCharge ??
      selectedLocation?.dropCharge ??
      (deliveryLocationName.includes("Railway") ? 400 : 0)
  );

  const durationDays = Math.max(primaryItem?.durationDays || 1, 1);
  const freeKmsTotal = primaryItem?.includedKm ?? durationDays * 240;
  const freeKmsPerDay = Math.round(freeKmsTotal / durationDays);
  const freeKmsLabel = `${freeKmsTotal}km (${freeKmsPerDay}km x ${durationDays} days)`;

  const refundableDeposit = primaryItem?.securityDeposit ?? 5000;
  const fuelType = primaryItem?.fuelType || "Petrol";
  const extraKmRate = primaryItem?.extraKmPrice ?? 10;

  // Subtotal & Grand Total calculations
  const calculatedSubtotal = Math.max(
    0,
    items.reduce(
      (sum, item) => sum + Math.max(0, (item.total ?? 0) - (item.locationDropCharge ?? 0)),
      0
    )
  );
  const effectiveSubtotal =
    calculatedSubtotal > 0
      ? calculatedSubtotal
      : items.reduce((sum, item) => sum + (item.basePrice || item.dailyPrice || 6840), 0);

  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const grandTotal = Math.max(
    0,
    effectiveSubtotal + deliveryCharge + refundableDeposit - totalDiscount
  );

  // Payment method selection: "PICKUP" (Cash / UPI at handover) or "ONLINE"
  const [paymentMethod, setPaymentMethod] = React.useState<"PICKUP" | "ONLINE">("PICKUP");

  const payableOnDelivery = paymentMethod === "PICKUP" ? grandTotal : 0;
  const payableNow = paymentMethod === "ONLINE" ? grandTotal : 0;

  const handleLocationChange = (locationId: string) => {
    if (!primaryItem) return;
    if (!locationId) {
      updateItem(primaryItem.id, {
        dropLocationId: undefined,
        locationDropCharge: 0,
      });
      setIsChangingLocation(false);
      toast.info("Drop location reset to Standard Branch.");
      return;
    }
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) return;
    updateItem(primaryItem.id, {
      dropLocationId: loc.id,
      locationDropCharge: loc.dropCharge,
      locationName: primaryItem.locationName?.includes("→")
        ? `${primaryItem.locationName.split("→")[0]?.trim()} → ${loc.name}`
        : `${primaryItem.locationName || "Udaipur"} → ${loc.name}`,
    });
    setIsChangingLocation(false);
    toast.success(`Delivery Location updated to ${loc.name}`);
  };

  // Authentication hooks
  const { data: currentUser } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  // Form Field Values matching requested Billing details form
  const [formValues, setFormValues] = React.useState({
    fullName: "",
    phone: "",
    licenseNumber: "",
    city: "",
    aadharNumber: "",
    email: "",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Inline Login toggle & state
  const [showLogin, setShowLogin] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // Legal checks
  const [hasLicense, setHasLicense] = React.useState(true);
  const [agreeTerms, setAgreeTerms] = React.useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Auto-fill form fields whenever user is authenticated
  React.useEffect(() => {
    if (currentUser) {
      setFormValues((prev) => ({
        ...prev,
        fullName: prev.fullName || `${currentUser.firstName} ${currentUser.lastName}`.trim(),
        phone: prev.phone || currentUser.phone || "",
        email: prev.email || currentUser.email || "",
      }));
    }
  }, [currentUser]);

  // Handle Field Input Change
  const handleFieldChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Handle Inline Sign In
  const handleInlineLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError("Please enter your email and password.");
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      toast.success(`Welcome back, ${res.user.firstName}! Contact details pre-filled.`);
      setFormValues((prev) => ({
        ...prev,
        fullName: `${res.user.firstName} ${res.user.lastName}`.trim(),
        phone: res.user.phone || prev.phone,
        email: res.user.email,
      }));
      setLoginPassword("");
      setShowLogin(false);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Invalid email or password. Please try again.";
      setLoginError(msg);
      toast.error(msg);
    }
  };

  // Handle Checkout Submission
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error("Please accept the rental policy and terms of service.");
      return;
    }

    const newErrors: Record<string, string> = {};
    if (!formValues.fullName.trim()) {
      newErrors.fullName = "Full Name is required";
    }
    const cleanPhone = formValues.phone.replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      newErrors.phone = "Valid 10-digit Phone Number is required";
    }
    if (!formValues.city.trim()) {
      newErrors.city = "City is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields marked with *");
      return;
    }

    setIsSubmitting(true);

    try {
      const primaryItem = items[0];
      if (!primaryItem) throw new Error("No vehicle found in cart.");

      const nameParts = formValues.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Customer";
      const lastName = nameParts.slice(1).join(" ") || "";
      const customerEmail = formValues.email.trim() || `${cleanPhone}@guest.srmcarrentals.com`;

      const payload = {
        carId: primaryItem.carId,
        customerId: currentUser?.customerId,
        customer: {
          firstName,
          lastName,
          phone: formValues.phone.trim(),
          email: customerEmail,
          userId: currentUser?.id,
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
          <span className="font-semibold text-orange-400">Checkout</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        {/* Page Title & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-400 border border-orange-500/20">
              Secure Checkout • 256-Bit SSL
            </span>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Complete Your Reservation
            </h1>
            <p className="text-xs text-white/50 mt-1">
              Finalize driver contact details, verification requirements, and payment preferences.
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
            <div className="space-y-6">

              {/* Logged in member badge or login prompt */}
              {currentUser ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <UserCheck className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {currentUser.firstName} {currentUser.lastName}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                          Verified Member
                        </span>
                      </div>
                      <p className="text-xs text-white/60">{currentUser.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="rounded-xl border border-white/10 bg-white/5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="size-3.5 mr-1.5" /> Sign Out
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-white/70">
                    <User className="size-4 text-orange-400" />
                    <span>Already have an account with SRM?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-orange-400 font-bold hover:underline"
                  >
                    {showLogin ? "Close Login" : "Click here to sign in"}
                  </button>
                </div>
              )}

              {/* Inline Login form */}
              {showLogin && !currentUser && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                    <LogIn className="size-4" /> Sign In to Your SRM Account
                  </div>
                  <form onSubmit={handleInlineLogin} className="mt-4 space-y-3">
                    {loginError && (
                      <p className="text-xs text-red-400">{loginError}</p>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-11 rounded-xl border border-white/10 bg-black/60 px-3.5 text-xs text-white outline-none focus:border-orange-500"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-11 rounded-xl border border-white/10 bg-black/60 px-3.5 text-xs text-white outline-none focus:border-orange-500"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/20"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In & Pre-fill"}
                    </Button>
                  </form>
                </div>
              )}

              {/* ── SECTION: Billing details (Matching User Reference) ── */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 sm:p-8 backdrop-blur shadow-xl space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Billing details
                  </h2>
                </div>

                <div className="space-y-5">
                  {/* ROW 1: Full Name * & Phone Number * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-white/90">
                        Full Name <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formValues.fullName}
                        onChange={(e) => handleFieldChange("fullName", e.target.value)}
                        placeholder=""
                        className={`h-12 w-full rounded-lg border-2 bg-transparent px-3.5 text-sm text-white outline-none transition ${
                          errors.fullName
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#1e5bb8] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-400">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-white/90">
                        Phone Number <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formValues.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        placeholder=""
                        className={`h-12 w-full rounded-lg border-2 bg-transparent px-3.5 text-sm text-white outline-none transition ${
                          errors.phone
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#1e5bb8] focus:border-blue-500"
                        }`}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-400">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* ROW 2: Driving License Number (optional) */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-white/90">
                      Driving License Number (optional)
                    </label>
                    <input
                      type="text"
                      value={formValues.licenseNumber}
                      onChange={(e) => handleFieldChange("licenseNumber", e.target.value)}
                      placeholder="Enter your driving license number"
                      className="h-12 w-full rounded-lg border-2 border-[#1e5bb8] bg-transparent px-3.5 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
                    />
                  </div>

                  {/* ROW 3: City * & Aadhar Number (optional) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-white/90">
                        City <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formValues.city}
                        onChange={(e) => handleFieldChange("city", e.target.value)}
                        placeholder=""
                        className={`h-12 w-full rounded-lg border-2 bg-transparent px-3.5 text-sm text-white outline-none transition ${
                          errors.city
                            ? "border-red-500 focus:border-red-500"
                            : "border-[#1e5bb8] focus:border-blue-500"
                        }`}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-400">{errors.city}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-white/90">
                        Aadhar Number (optional)
                      </label>
                      <input
                        type="text"
                        value={formValues.aadharNumber}
                        onChange={(e) => handleFieldChange("aadharNumber", e.target.value)}
                        placeholder=""
                        className="h-12 w-full rounded-lg border-2 border-[#1e5bb8] bg-transparent px-3.5 text-sm text-white placeholder:text-neutral-500 outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION: Payment Method Selection ── */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">Payment Preference</h2>
                    <p className="text-[11px] text-white/50">Choose when and how you wish to settle this booking.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  {/* Option A: Pay at Pickup */}
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
                        <span className="font-bold text-xs text-white">Pay at Handover / Pickup</span>
                      </div>
                      <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        Zero Risk
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-white/60">
                      ₹0 upfront charge now. Pay via UPI, Cash, or Card after inspecting the vehicle.
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
                      Settle payment digitally via Google Pay, PhonePe, Paytm, or NetBanking.
                    </p>
                  </label>
                </div>
              </div>

              {/* ── SECTION: Driver License & Terms Verification ── */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white uppercase tracking-tight">Terms &amp; Eligibility</h2>
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
                      <strong className="text-white">Rental Policy &amp; Safety Limit:</strong> I agree to SRM&apos;s rental agreement, speed limit compliance (80 km/h), driver age requirements (min 21+ years), and understand that a refundable security deposit is collected at vehicle pickup.
                    </span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSubmitCheckout}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="size-5 animate-spin" /> Securing Your Vehicle Hold...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Confirm Reservation (15-Min Hold) • {formatInr(grandTotal)} →
                      </span>
                    )}
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-white/40">
                    By clicking Confirm Reservation, your vehicle is locked in the system and an instant booking voucher is created.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-3xl border border-white/10 bg-neutral-900/90 p-6 backdrop-blur shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-tight">Order Summary</h3>
                  <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-[10px] font-bold text-orange-400">
                    {items.length} Car{items.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Car Item Preview */}
                <div className="divide-y divide-white/10 py-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 space-y-2">
                      <div className="flex items-start gap-3">
                        {item.carImage ? (
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black">
                            <Image
                              src={item.carImage}
                              alt={item.carName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-orange-400">
                            <CarFront className="size-5" />
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
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Exact Order Summary Breakdown ── */}
                <div className="border-t border-white/10 pt-3 space-y-3 text-xs sm:text-sm">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/90">Subtotal:</span>
                    <span className="font-bold text-white">{formatInr(effectiveSubtotal)}</span>
                  </div>

                  {/* Free Kms */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/90">Free Kms:</span>
                    <span className="font-semibold text-white/90">{freeKmsLabel}</span>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white/90">Delivery Location:</span>
                        {locations.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsChangingLocation((prev) => !prev)}
                            className="text-[10px] font-semibold text-orange-400 hover:text-orange-300 underline underline-offset-2"
                          >
                            {isChangingLocation ? "Done" : "Change"}
                          </button>
                        )}
                      </div>
                      <span className="font-bold text-white text-right truncate max-w-[180px]">
                        {deliveryLocationName}
                      </span>
                    </div>

                    {/* Change location selector */}
                    {isChangingLocation && locations.length > 0 && (
                      <div className="py-1">
                        <select
                          value={primaryItem?.dropLocationId || ""}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="w-full rounded-xl border border-white/20 bg-neutral-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="">Standard Branch Pickup (Free)</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id} className="bg-neutral-900 text-white">
                              {loc.name} {loc.dropCharge > 0 ? `(+₹${loc.dropCharge})` : "(Free)"}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Delivery Charge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/90">Delivery Charge:</span>
                    <span className="font-bold text-white">{formatInr(deliveryCharge)}</span>
                  </div>

                  {/* Refundable Deposit */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/90">Refundable Deposit:</span>
                    <span className="font-bold text-white">{formatInr(refundableDeposit)}</span>
                  </div>

                  {/* Coupon Discount (if applied) */}
                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span>Coupon Discount:</span>
                      <span>-{formatInr(totalDiscount)}</span>
                    </div>
                  )}

                  {/* Group Divider */}
                  <div className="border-t border-white/10 my-2" />

                  {/* Fuel */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/90">Fuel:</span>
                    <span className="font-semibold text-white">{fuelType}</span>
                  </div>

                  {/* Extra kms charge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/90">Extra kms charge:</span>
                    <span className="font-bold text-white">{formatInr(extraKmRate)}</span>
                  </div>

                  {/* Group Divider */}
                  <div className="border-t border-white/10 my-2" />

                  {/* Grand Total */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Grand Total:</span>
                    <span className="text-lg font-black text-white">{formatInr(grandTotal)}</span>
                  </div>

                  {/* Group Divider */}
                  <div className="border-t border-white/10 my-2" />

                  {/* Payable on Delivery / Online Container */}
                  <div
                    className={`rounded-xl border p-3.5 flex items-center justify-between transition-all ${
                      paymentMethod === "PICKUP"
                        ? "border-emerald-500/30 border-l-4 border-l-emerald-500 bg-emerald-500/10"
                        : "border-orange-500/30 border-l-4 border-l-orange-500 bg-orange-500/10"
                    }`}
                  >
                    <span
                      className={`text-sm sm:text-base font-bold ${
                        paymentMethod === "PICKUP" ? "text-emerald-400" : "text-orange-400"
                      }`}
                    >
                      {paymentMethod === "PICKUP" ? "Payable on Delivery:" : "Payable Now:"}
                    </span>
                    <span
                      className={`text-lg sm:text-xl font-black ${
                        paymentMethod === "PICKUP" ? "text-emerald-400" : "text-orange-400"
                      }`}
                    >
                      {formatInr(grandTotal)}
                    </span>
                  </div>

                  {/* Secondary Payable Row */}
                  <div className="flex items-center justify-between px-1 text-xs sm:text-sm text-white/70">
                    <span className="font-medium text-white/70">
                      {paymentMethod === "PICKUP" ? "Payable Now:" : "Payable on Delivery:"}
                    </span>
                    <span className="font-bold text-white">{formatInr(0)}</span>
                  </div>

                  {/* Info Notice Box */}
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60 flex items-start gap-2.5 leading-relaxed mt-2">
                    <Info className="size-4 text-white/50 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-white/80">Total includes:</strong> Subtotal + Delivery + Refundable Deposit. Deposit will be refunded upon vehicle return.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
