"use client";

import { ADVANCE_PERCENT, splitAdvance } from "@/lib/checkout/advance";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, CarFront, CheckCircle2, ChevronRight, Clock, Info, Loader2, LogIn, LogOut, Receipt, ShieldCheck, ShoppingBag, User, UserCheck } from "lucide-react";
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

/** Digits only, capped at 10 (drops a pasted +91 / leading 0 prefix). */
function toTenDigits(value: string): string {
  let digits = value.replace(/[^0-9]/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear, updateItem } = useCart();

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

  // Payment method selection: "PICKUP" (Cash / UPI at handover) or "ONLINE" (30% advance)
  const [paymentMethod, setPaymentMethod] = React.useState<"PICKUP" | "ONLINE">("PICKUP");

  // The 30% advance applies to the rental amount; the refundable deposit is collected at handover.
  const rentalPayable = Math.max(0, grandTotal - refundableDeposit);
  const advance = splitAdvance(rentalPayable);
  const payableNow = paymentMethod === "ONLINE" ? advance.now : 0;
  const payableLater = grandTotal - payableNow;

  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

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
        phone: prev.phone || toTenDigits(currentUser.phone || ""),
        email: prev.email || currentUser.email || "",
      }));
    }
  }, [currentUser]);

  const fieldError = (id: string, value: string): string | undefined => {
    if (id === "fullName" && !value.trim()) return "Please enter your full name";
    if (id === "phone" && value.replace(/[^0-9]/g, "").length !== 10) return "Enter a valid 10-digit mobile number";
    if (id === "city" && !value.trim()) return "Please enter your city";
    if (id === "email" && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Enter a valid email address";
    if (id === "aadharNumber" && value.replace(/\D/g, "").length > 0 && value.replace(/\D/g, "").length !== 12) {
      return "Aadhaar must be 12 digits";
    }
    return undefined;
  };

  const handleBlur = (id: string) => {
    setTouched((t) => ({ ...t, [id]: true }));
    const message = fieldError(id, (formValues as Record<string, string>)[id] ?? "");
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });
  };

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
        phone: toTenDigits(res.user.phone || "") || prev.phone,
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

    const cleanPhone = formValues.phone.replace(/[^0-9]/g, "");
    const newErrors: Record<string, string> = {};
    for (const id of ["fullName", "phone", "city", "email", "aadharNumber"] as const) {
      const message = fieldError(id, formValues[id]);
      if (message) newErrors[id] = message;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ fullName: true, phone: true, city: true, email: true, aadharNumber: true });
      toast.error("Please fix the highlighted fields");
      const first = ["fullName", "phone", "city", "email", "aadharNumber"].find((id) => newErrors[id]);
      const el = first ? document.getElementById(`co-${first}`) : null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLInputElement | null)?.focus({ preventScroll: true });
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
          phone: cleanPhone,
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
        paymentMethod,
        // Everything else shown/entered on this page, captured with the booking
        details: {
          customer: {
            licenseNumber: formValues.licenseNumber.trim() || undefined,
            aadhaarNumber: formValues.aadharNumber.trim() || undefined,
            city: formValues.city.trim(),
            emailProvided: Boolean(formValues.email.trim()),
            hasValidLicense: hasLicense,
            agreedToTerms: agreeTerms,
          },
          selection: {
            rentalMode: primaryItem.rentalMode,
            kmLimit: primaryItem.includedKm,
            extraKmPrice: primaryItem.extraKmPrice,
            deliveryType: primaryItem.deliveryType,
            locationLabel: primaryItem.locationName,
            durationText: primaryItem.durationText,
            insuranceName: primaryItem.insurance?.name,
            extraServiceNames: primaryItem.extraServices.map((x) => x.name),
            couponCode: primaryItem.couponCode,
            securityDeposit: primaryItem.securityDeposit,
          },
          payment: { grandTotal, payableNow, payableLater },
        },
      };

      const result = await apiFetch<{
        bookingReference: string;
        paymentUrl?: string;
        paymentLinkId?: string;
      }>("/bookings", {
        method: "POST",
        body: payload,
        skipAuthRedirect: true,
      });

      // Clear cart on successful booking reservation
      clear();

      if (paymentMethod === "ONLINE" && result.paymentUrl) {
        toast.success("Redirecting to Razorpay for phone verification & payment...");
        window.location.href = result.paymentUrl;
        return;
      }

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
      <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-24 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-orange-50 border border-orange-200 text-orange-500 mb-6 shadow-sm">
            <ShoppingBag className="size-10" />
          </div>
          <h1 className="text-3xl font-black text-neutral-950 uppercase tracking-tight">Your Cart is Empty</h1>
          <p className="mt-3 text-sm text-neutral-600 max-w-md">
            You don&apos;t have any vehicles in your checkout cart yet. Browse our verified self-drive fleet, choose trip dates, and add a vehicle to continue.
          </p>
          <Button asChild className="mt-8 bg-orange-500 hover:bg-orange-600 font-bold px-8 py-3 text-sm rounded-xl text-white shadow-lg shadow-orange-500/20">
            <Link href="/cars">Explore Self-Drive Fleet →</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      {/* Top Breadcrumb */}
      <div className="border-b border-neutral-200/80 bg-white/80 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1520px] items-center gap-1.5 px-4 text-xs text-neutral-500 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-neutral-900 transition">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/cars" className="hover:text-neutral-900 transition">Fleet</Link>
          <ChevronRight className="size-3" />
          <Link href="/cart" className="hover:text-neutral-900 transition">Cart</Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-orange-600">Checkout</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        {/* Page Title & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-600 border border-orange-500/20">
              Secure Checkout • 256-Bit SSL
            </span>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-neutral-950 sm:text-3xl">
              Complete Your Reservation
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              Finalize driver contact details, verification requirements, and payment preferences.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-emerald-600" /> Free Cancellation
            </span>
            <span className="text-neutral-300">|</span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-orange-500" /> Instant 15-Min Hold
            </span>
          </div>
        </div>

        {/* Progress */}
        <ol className="mt-6 flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase sm:gap-3 sm:text-xs">
          {[
            { label: "Cart", state: "done" },
            { label: "Your details", state: "active" },
            { label: paymentMethod === "ONLINE" ? "Pay advance" : "Confirm", state: "todo" },
          ].map((step, i, arr) => (
            <React.Fragment key={step.label}>
              <li className={`flex items-center gap-2 ${step.state === "todo" ? "text-neutral-400" : "text-neutral-900"}`}>
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-[11px] font-black ${
                    step.state === "done"
                      ? "bg-emerald-500 text-white"
                      : step.state === "active"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                        : "border border-neutral-300 text-neutral-400"
                  }`}
                >
                  {step.state === "done" ? <CheckCircle2 className="size-3.5" /> : i + 1}
                </span>
                {step.label}
              </li>
              {i < arr.length - 1 && <span className="h-px flex-1 bg-neutral-200" />}
            </React.Fragment>
          ))}
        </ol>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN: Checkout Form (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <div className="space-y-6">

              {/* Logged in member badge or login prompt */}
              {currentUser ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 border border-emerald-200">
                      <UserCheck className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-neutral-950">
                          {currentUser.firstName} {currentUser.lastName}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-700">
                          Verified Member
                        </span>
                      </div>
                      <p className="text-xs text-neutral-600">{currentUser.email}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="rounded-xl border border-neutral-200 bg-white text-xs text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    ) : (
                      <LogOut className="size-3.5 mr-1.5" />
                    )}
                    {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 font-medium">
                    <User className="size-4 text-orange-500" />
                    <span>Already have an account with SRM?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    {showLogin ? "Close Login" : "Click here to sign in"}
                  </button>
                </div>
              )}

              {/* Inline Login form */}
              {showLogin && !currentUser && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <LogIn className="size-4" /> Sign In to Your SRM Account
                  </div>
                  <form onSubmit={handleInlineLogin} className="mt-4 space-y-3">
                    {loginError && (
                      <p className="text-xs text-red-500 font-medium">{loginError}</p>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-xs text-neutral-900 outline-none focus:border-orange-500 shadow-xs"
                      />
                      <input
                        type="password"
                        required
                        placeholder="Password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-xs text-neutral-900 outline-none focus:border-orange-500 shadow-xs"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 text-xs font-bold text-white shadow-lg shadow-orange-500/20"
                    >
                      {loginMutation.isPending ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" /> Signing In...
                        </span>
                      ) : (
                        "Sign In & Pre-fill"
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* ── SECTION: Billing details (Matching User Reference) ── */}
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                    <User className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">Your details</h2>
                    <p className="text-[11px] text-neutral-500">Fields marked * are required.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <CheckoutField id="fullName" label="Full name" required error={touched.fullName ? errors.fullName : undefined} hint="As on your driving license">
                    <input
                      id="co-fullName"
                      type="text"
                      autoComplete="name"
                      value={formValues.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      placeholder="e.g. Rahul Sharma"
                      className={fieldClass(touched.fullName && !!errors.fullName)}
                    />
                  </CheckoutField>

                  <CheckoutField id="phone" label="Mobile number" required error={touched.phone ? errors.phone : undefined} hint="We send your booking confirmation here">
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 border-r border-neutral-200 pr-2.5 text-sm font-semibold text-neutral-500">
                        +91
                      </span>
                      <input
                        id="co-phone"
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        value={formValues.phone}
                        onChange={(e) => handleFieldChange("phone", toTenDigits(e.target.value))}
                        onBlur={() => handleBlur("phone")}
                        placeholder="98765 43210"
                        className={`${fieldClass(touched.phone && !!errors.phone)} pl-16`}
                      />
                      {formValues.phone.length === 10 && !errors.phone && (
                        <CheckCircle2 className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-emerald-500" />
                      )}
                    </div>
                  </CheckoutField>

                  <CheckoutField id="email" label="Email" error={touched.email ? errors.email : undefined} hint="Optional — for your invoice & voucher">
                    <input
                      id="co-email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      placeholder="you@example.com"
                      className={fieldClass(touched.email && !!errors.email)}
                    />
                  </CheckoutField>

                  <CheckoutField id="city" label="City" required error={touched.city ? errors.city : undefined} hint="Where you live or are staying">
                    <input
                      id="co-city"
                      type="text"
                      autoComplete="address-level2"
                      value={formValues.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      onBlur={() => handleBlur("city")}
                      placeholder="e.g. Udaipur"
                      className={fieldClass(touched.city && !!errors.city)}
                    />
                  </CheckoutField>

                  <CheckoutField id="licenseNumber" label="Driving license number" hint="Optional — speeds up handover">
                    <input
                      id="co-licenseNumber"
                      type="text"
                      autoCapitalize="characters"
                      value={formValues.licenseNumber}
                      onChange={(e) => handleFieldChange("licenseNumber", e.target.value.toUpperCase())}
                      placeholder="e.g. RJ14 20200012345"
                      className={fieldClass(false)}
                    />
                  </CheckoutField>

                  <CheckoutField id="aadharNumber" label="Aadhaar number" error={touched.aadharNumber ? errors.aadharNumber : undefined} hint="Optional — only the last 4 digits are stored">
                    <input
                      id="co-aadharNumber"
                      type="text"
                      inputMode="numeric"
                      maxLength={14}
                      value={formValues.aadharNumber}
                      onChange={(e) =>
                        handleFieldChange(
                          "aadharNumber",
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 12)
                            .replace(/(\d{4})(?=\d)/g, "$1 "),
                        )
                      }
                      onBlur={() => handleBlur("aadharNumber")}
                      placeholder="XXXX XXXX XXXX"
                      className={fieldClass(touched.aadharNumber && !!errors.aadharNumber)}
                    />
                  </CheckoutField>
                </div>
              </div>

              {/* ── SECTION: Payment Method Selection ── */}
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                    <Receipt className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-950 uppercase tracking-tight">Payment Preference</h2>
                    <p className="text-[11px] text-neutral-500">Choose when and how you wish to settle this booking.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  {/* Option A: Pay at Pickup */}
                  <label
                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${
                      paymentMethod === "PICKUP"
                        ? "border-orange-500 bg-orange-50/80 shadow-md shadow-orange-500/10"
                        : "border-neutral-200 bg-neutral-50/80 hover:border-neutral-300"
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
                        <span className="font-bold text-xs text-neutral-950">Pay at Handover / Pickup</span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        Zero Risk
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-600">
                      ₹0 upfront charge now. Pay via UPI, Cash, or Card after inspecting the vehicle.
                    </p>
                  </label>

                  {/* Option B: Online Advance via Razorpay */}
                  <label
                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${
                      paymentMethod === "ONLINE"
                        ? "border-orange-500 bg-orange-50/80 shadow-md shadow-orange-500/10"
                        : "border-neutral-200 bg-neutral-50/80 hover:border-neutral-300"
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
                        <span className="font-bold text-xs text-neutral-950">Pay {ADVANCE_PERCENT}% Advance Online</span>
                      </div>
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                        Phone OTP Verified
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-600">
                      Pay {formatInr(advance.now)} now ({ADVANCE_PERCENT}% of the rental) and the remaining {formatInr(grandTotal - advance.now)} (incl. refundable deposit) at vehicle handover. Mobile number is verified via Razorpay OTP; pay securely with UPI (GPay/PhonePe/Paytm), Cards, or NetBanking.
                    </p>
                  </label>
                </div>
              </div>

              {/* ── SECTION: Driver License & Terms Verification ── */}
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-950 uppercase tracking-tight">Terms &amp; Eligibility</h2>
                    <p className="text-[11px] text-neutral-500">Standard verification requirements set by Rajasthan RTO and SRM policy.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 text-xs text-neutral-700 transition hover:bg-neutral-100/70">
                    <input
                      type="checkbox"
                      checked={hasLicense}
                      onChange={(e) => setHasLicense(e.target.checked)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span>
                      <strong className="text-neutral-950">Original Driving License (LMV):</strong> I hold an original valid Indian Driving License (minimum 1 year old) and will present it alongside Government ID (Aadhaar/Passport) at vehicle handover.
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 text-xs text-neutral-700 transition hover:bg-neutral-100/70">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 accent-orange-500"
                    />
                    <span>
                      <strong className="text-neutral-950">Rental Policy &amp; Safety Limit:</strong> I agree to SRM&apos;s rental agreement, speed limit compliance (80 km/h), driver age requirements (min 21+ years), and understand that a refundable security deposit is collected at vehicle pickup.
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
                        <Loader2 className="size-5 animate-spin" />
                        {paymentMethod === "ONLINE"
                          ? "Connecting to Razorpay for Phone Verification..."
                          : "Securing Your Vehicle Hold..."}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {paymentMethod === "ONLINE" ? (
                          <>Pay {formatInr(advance.now)} &amp; Reserve →</>
                        ) : (
                          <>Confirm Reservation →</>
                        )}
                      </span>
                    )}
                  </Button>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500">
                    <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                    {paymentMethod === "ONLINE"
                      ? `You will be redirected to Razorpay to verify your phone number and pay the ${ADVANCE_PERCENT}% advance. The balance is due at handover.`
                      : "By clicking Confirm Reservation, your vehicle is locked in the system and an instant booking voucher is created."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary (4 cols) */}
          <div className="max-lg:order-first lg:col-span-5 xl:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-4">
              <button
                type="button"
                onClick={() => setSummaryOpen((v) => !v)}
                aria-expanded={summaryOpen}
                className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-left shadow-sm lg:hidden"
              >
                <span className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <Receipt className="size-4 text-orange-500" />
                  {summaryOpen ? "Hide" : "Show"} order summary
                </span>
                <span className="text-base font-black text-neutral-950">{formatInr(grandTotal)}</span>
              </button>
              <div className={`${summaryOpen ? "block" : "hidden"} rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-2xl space-y-4 lg:block`}>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-950 uppercase tracking-tight">Order Summary</h3>
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-500/20">
                    {items.length} Car{items.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Car Item Preview */}
                <div className="divide-y divide-neutral-100 py-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 space-y-2">
                      <div className="flex items-start gap-3">
                        {item.carImage ? (
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                            <Image
                              src={item.carImage}
                              alt={item.carName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-orange-500">
                            <CarFront className="size-5" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-950 truncate">{item.carName}</h4>
                          <span className="inline-block rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 uppercase border border-orange-200">
                            {item.rentalMode === "HOURLY" ? "Hourly Rental" : "Daily 24h"}
                          </span>

                          <div className="mt-1 text-[11px] text-neutral-600 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="size-3 text-orange-500 shrink-0" />
                              <span className="truncate">{formatDate(item.pickup)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="size-3 text-neutral-400 shrink-0" />
                              <span>{item.durationText}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Exact Order Summary Breakdown ── */}
                <div className="border-t border-neutral-200 pt-3 space-y-3 text-xs sm:text-sm">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Subtotal:</span>
                    <span className="font-bold text-neutral-950">{formatInr(effectiveSubtotal)}</span>
                  </div>

                  {/* Free Kms */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Free Kms:</span>
                    <span className="font-semibold text-neutral-950">{freeKmsLabel}</span>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-700">Delivery Location:</span>
                        {locations.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsChangingLocation((prev) => !prev)}
                            className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 underline underline-offset-2"
                          >
                            {isChangingLocation ? "Done" : "Change"}
                          </button>
                        )}
                      </div>
                      <span className="font-bold text-neutral-950 text-right truncate max-w-[180px]">
                        {deliveryLocationName}
                      </span>
                    </div>

                    {/* Change location selector */}
                    {isChangingLocation && locations.length > 0 && (
                      <div className="py-1">
                        <select
                          value={primaryItem?.dropLocationId || ""}
                          onChange={(e) => handleLocationChange(e.target.value)}
                          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 outline-none focus:border-orange-500 cursor-pointer shadow-xs"
                        >
                          <option value="">Standard Branch Pickup (Free)</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id} className="bg-white text-neutral-900">
                              {loc.name} {loc.dropCharge > 0 ? `(+₹${loc.dropCharge})` : "(Free)"}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Delivery Charge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Delivery Charge:</span>
                    <span className="font-bold text-neutral-950">{formatInr(deliveryCharge)}</span>
                  </div>

                  {/* Refundable Deposit */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Refundable Deposit:</span>
                    <span className="font-bold text-neutral-950">{formatInr(refundableDeposit)}</span>
                  </div>

                  {/* Coupon Discount (if applied) */}
                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-bold">
                      <span>Coupon Discount:</span>
                      <span>-{formatInr(totalDiscount)}</span>
                    </div>
                  )}

                  {/* Group Divider */}
                  <div className="border-t border-neutral-200 my-2" />

                  {/* Fuel */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Fuel:</span>
                    <span className="font-semibold text-neutral-950">{fuelType}</span>
                  </div>

                  {/* Extra kms charge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">Extra kms charge:</span>
                    <span className="font-bold text-neutral-950">{formatInr(extraKmRate)}</span>
                  </div>

                  {/* Group Divider */}
                  <div className="border-t border-neutral-200 my-2" />

                  {/* Grand Total */}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-900">Grand Total:</span>
                    <span className="text-lg font-black text-neutral-950">{formatInr(grandTotal)}</span>
                  </div>

                  {/* Group Divider */}
                  <div className="border-t border-neutral-200 my-2" />

                  {/* Payment breakdown */}
                  <div className="rounded-xl border border-orange-500/40 border-l-4 border-l-orange-500 bg-orange-50 p-3.5 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-orange-800">
                      Payable Now{paymentMethod === "ONLINE" ? ` (${ADVANCE_PERCENT}%)` : ""}:
                    </span>
                    <span className="text-lg sm:text-xl font-black text-orange-600">{formatInr(payableNow)}</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/40 border-l-4 border-l-emerald-600 bg-emerald-50 p-3.5 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-emerald-800">
                      Payable Later{paymentMethod === "ONLINE" ? ` (${100 - ADVANCE_PERCENT}%)` : ""}:
                    </span>
                    <span className="text-lg sm:text-xl font-black text-emerald-700">{formatInr(payableLater)}</span>
                  </div>
                  <p className="px-1 text-[11px] text-neutral-500">
                    {paymentMethod === "ONLINE"
                      ? "The balance is collected at vehicle handover."
                      : "Everything is payable at vehicle handover. Choose online to lock in your booking with a 30% advance."}
                  </p>

                  {/* Info Notice Box */}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600 flex items-start gap-2.5 leading-relaxed mt-2">
                    <Info className="size-4 text-neutral-400 shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-neutral-900">Total includes:</strong> Subtotal + Delivery + Refundable Deposit. Deposit will be refunded upon vehicle return.
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


function fieldClass(hasError: boolean) {
  return `h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
      : "border-neutral-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
  }`;
}

function CheckoutField({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`co-${id}`} className="text-sm font-semibold text-neutral-800">
        {label} {required && <span className="font-bold text-red-500">*</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="flex items-center gap-1 text-xs font-medium text-red-600">
          <Info className="size-3.5 shrink-0" /> {error}
        </p>
      ) : (
        hint && <p className="text-[11px] text-neutral-500">{hint}</p>
      )}
    </div>
  );
}
