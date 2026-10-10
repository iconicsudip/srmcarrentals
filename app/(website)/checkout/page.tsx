"use client";

import { splitAdvance } from "@/lib/checkout/advance";
import { DEFAULT_PAYMENT_OPTIONS, type PaymentOptions } from "@/lib/payments/types";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, CarFront, CheckCircle2, ChevronRight, Clock, Info, Loader2, LogIn, LogOut, Receipt, ShieldCheck, ShoppingBag, User, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { InfoTip } from "@/components/website/info-tip";
import { CarThumb } from "@/components/website/car-thumb";
import { useCopy } from "@/components/copy-provider";
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
  const t = useCopy();
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

  // Payment methods, advance % and deposit come from Admin → Settings → Payments.
  const [payOpts, setPayOpts] = React.useState<PaymentOptions>(DEFAULT_PAYMENT_OPTIONS);
  React.useEffect(() => {
    let cancelled = false;
    apiFetch<PaymentOptions>("/payment-options", { skipAuthRedirect: true })
      .then((o) => {
        if (cancelled || !o) return;
        setPayOpts(o);
        setPaymentMethod((cur) => (cur === "ONLINE" && !o.enableOnline ? "PICKUP" : cur === "PICKUP" && !o.enablePayOnPickup ? "ONLINE" : cur));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const refundableDeposit = payOpts.securityDeposit;
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
  const advance = splitAdvance(rentalPayable, payOpts.advancePercent);
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
    toast.success(t("checkout.toast-location-updated", { name: loc.name }));
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
    if (id === "fullName" && !value.trim()) return t("checkout.err-name");
    if (id === "phone" && value.replace(/[^0-9]/g, "").length !== 10) return t("checkout.err-phone");
    if (id === "city" && !value.trim()) return t("checkout.err-city");
    if (id === "email" && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return t("checkout.err-email");
    if (id === "aadharNumber" && value.replace(/\D/g, "").length > 0 && value.replace(/\D/g, "").length !== 12) {
      return t("checkout.err-aadhaar");
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
      setLoginError(t("checkout.toast-login-required"));
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      toast.success(t("checkout.toast-welcome", { name: res.user.firstName }));
      setFormValues((prev) => ({
        ...prev,
        fullName: `${res.user.firstName} ${res.user.lastName}`.trim(),
        phone: toTenDigits(res.user.phone || "") || prev.phone,
        email: res.user.email,
      }));
      setLoginPassword("");
      setShowLogin(false);
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : t("checkout.toast-login-failed");
      setLoginError(msg);
      toast.error(msg);
    }
  };

  // Handle Checkout Submission
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms) {
      toast.error(t("checkout.toast-accept-terms"));
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
      toast.error(t("checkout.toast-fix-fields"));
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
        toast.success(t("checkout.toast-redirect-pay"));
        window.location.href = result.paymentUrl;
        return;
      }

      toast.success(t("checkout.toast-confirmed"));
      router.push(`/booking/${result.bookingReference}`);
    } catch (err) {
      toast.error(
        err instanceof ApiRequestError ? err.message : t("checkout.toast-failed"),
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
          <h1 className="text-3xl font-black text-neutral-950 uppercase tracking-tight">{t("checkout.your-cart-is-empty")}</h1>
          <p className="mt-3 text-sm text-neutral-600 max-w-md">
            {t("checkout.you-dont-have-any")}
          </p>
          <Button asChild className="mt-8 bg-orange-500 hover:bg-orange-600 font-bold px-8 py-3 text-sm rounded-xl text-white shadow-lg shadow-orange-500/20">
            <Link href="/cars">{t("checkout.explore-selfdrive-fleet")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-28 text-neutral-900 lg:pb-0">
      {/* Top Breadcrumb */}
      <div className="border-b border-neutral-200/80 bg-white/80 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1520px] items-center gap-1.5 px-4 text-xs text-neutral-500 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-neutral-900 transition">{t("checkout.home")}</Link>
          <ChevronRight className="size-3" />
          <Link href="/cars" className="hover:text-neutral-900 transition">{t("checkout.fleet")}</Link>
          <ChevronRight className="size-3" />
          <Link href="/cart" className="hover:text-neutral-900 transition">{t("checkout.cart")}</Link>
          <ChevronRight className="size-3" />
          <span className="font-semibold text-orange-600">{t("checkout.checkout")}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:py-10 sm:px-6 lg:px-8">
        {/* Page Title & Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-600 border border-orange-500/20">
              {t("checkout.secure-checkout-256bit-ssl")}
            </span>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-neutral-950 sm:text-3xl">
              {t("checkout.complete-your-reservation")}
            </h1>
            <p className="text-xs text-neutral-600 mt-1">
              {t("checkout.finalize-driver-contact-details")}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-600">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-emerald-600" /> {t("checkout.free-cancellation")}
            </span>
            <span className="text-neutral-300">|</span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-orange-500" /> {t("checkout.instant-15min-hold")}
            </span>
          </div>
        </div>

        {/* Progress */}
        <ol className="mt-6 flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase sm:gap-3 sm:text-xs">
          {[
            { label: t("checkout.step-cart"), state: "done" },
            { label: t("checkout.step-details"), state: "active" },
            { label: paymentMethod === "ONLINE" ? t("checkout.step-pay-advance") : t("checkout.step-confirm"), state: "todo" },
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
                          {t("checkout.verified-member")}
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
                    {logoutMutation.isPending ? t("checkout.signing-out") : t("checkout.sign-out")}
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-neutral-700 font-medium">
                    <User className="size-4 text-orange-500" />
                    <span>{t("checkout.already-have-an-account")}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLogin(!showLogin)}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    {showLogin ? t("checkout.close-login") : t("checkout.open-login")}
                  </button>
                </div>
              )}

              {/* Inline Login form */}
              {showLogin && !currentUser && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                    <LogIn className="size-4" /> {t("checkout.sign-in-to-your")}
                  </div>
                  <form onSubmit={handleInlineLogin} className="mt-4 space-y-3">
                    {loginError && (
                      <p className="text-xs text-red-500 font-medium">{loginError}</p>
                    )}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="email"
                        required
                        placeholder={t("checkout.email-address")}
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-11 rounded-xl border border-neutral-300 bg-white px-3.5 text-xs text-neutral-900 outline-none focus:border-orange-500 shadow-xs"
                      />
                      <input
                        type="password"
                        required
                        placeholder={t("checkout.password")}
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
                          <Loader2 className="size-3.5 animate-spin" /> {t("checkout.signing-in")}
                        </span>
                      ) : (
                        t("checkout.signin-prefill")
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
                    <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">{t("checkout.your-details")}</h2>
                    <p className="text-[11px] text-neutral-500">{t("checkout.fields-marked-are-required")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                  <CheckoutField id="fullName" label={t("checkout.full-name")} required error={touched.fullName ? errors.fullName : undefined} hint={t("checkout.as-on-your-driving")}>
                    <input
                      id="co-fullName"
                      type="text"
                      autoComplete="name"
                      value={formValues.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleBlur("fullName")}
                      placeholder={t("checkout.eg-rahul-sharma")}
                      className={fieldClass(touched.fullName && !!errors.fullName)}
                    />
                  </CheckoutField>

                  <CheckoutField id="phone" label={t("checkout.mobile-number")} required error={touched.phone ? errors.phone : undefined} hint={t("checkout.we-send-your-booking")}>
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

                  <CheckoutField id="email" label={t("checkout.email")} error={touched.email ? errors.email : undefined} hint={t("checkout.optional-for-your-invoice")}>
                    <input
                      id="co-email"
                      type="email"
                      autoComplete="email"
                      value={formValues.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      placeholder={t("checkout.youexamplecom")}
                      className={fieldClass(touched.email && !!errors.email)}
                    />
                  </CheckoutField>

                  <CheckoutField id="city" label={t("checkout.city")} required error={touched.city ? errors.city : undefined} hint={t("checkout.where-you-live-or")}>
                    <input
                      id="co-city"
                      type="text"
                      autoComplete="address-level2"
                      value={formValues.city}
                      onChange={(e) => handleFieldChange("city", e.target.value)}
                      onBlur={() => handleBlur("city")}
                      placeholder={t("checkout.eg-udaipur")}
                      className={fieldClass(touched.city && !!errors.city)}
                    />
                  </CheckoutField>

                  <CheckoutField id="licenseNumber" label={t("checkout.driving-license-number")} hint={t("checkout.optional-speeds-up-handover")}>
                    <input
                      id="co-licenseNumber"
                      type="text"
                      autoCapitalize="characters"
                      value={formValues.licenseNumber}
                      onChange={(e) => handleFieldChange("licenseNumber", e.target.value.toUpperCase())}
                      placeholder={t("checkout.eg-rj14-20200012345")}
                      className={fieldClass(false)}
                    />
                  </CheckoutField>

                  <CheckoutField id="aadharNumber" label={t("checkout.aadhaar-number")} error={touched.aadharNumber ? errors.aadharNumber : undefined} hint={t("checkout.optional-only-the-last")}>
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
                      placeholder={t("checkout.xxxx-xxxx-xxxx")}
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
                    <h2 className="text-base font-bold text-neutral-950 uppercase tracking-tight">{t("checkout.payment-preference")}</h2>
                    <p className="text-[11px] text-neutral-500">{t("checkout.choose-when-and-how")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                  {/* Option A: Pay at Pickup */}
                  {payOpts.enablePayOnPickup && (
                  <label
                    className={`relative flex cursor-pointer flex-col justify-start gap-1 rounded-2xl border p-4 transition-all ${
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
                        <span className="font-bold text-xs text-neutral-950">{t("checkout.pay-at-handover-pickup")}</span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        {t("checkout.zero-risk")}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-neutral-600">
                      {t("checkout.pickup-desc", {
                        methods: [payOpts.allowUpiOnPickup && "UPI", payOpts.allowCashOnPickup && "Cash", "Card"].filter(Boolean).join(", "),
                      })}
                    </p>
                  </label>
                  )}

                  {/* Option B: Online Advance via Razorpay */}
                  {payOpts.enableOnline && (
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
                        <span className="font-bold text-xs text-neutral-950">{t("checkout.online-title", { percent: payOpts.advancePercent })}</span>
                      </div>
                      <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 border border-orange-200">
                        {t("checkout.phone-otp-verified")}
                      </span>
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-2 text-[11px] text-neutral-600">
                      <span>{t("checkout.online-short", { now: formatInr(advance.now), later: formatInr(grandTotal - advance.now) })}</span>
                      <InfoTip label={t("checkout.online-info-label")}>
                        {t("checkout.online-desc", { now: formatInr(advance.now), percent: payOpts.advancePercent, later: formatInr(grandTotal - advance.now) })}
                      </InfoTip>
                    </div>
                  </label>
                  )}
                </div>
              </div>

              {/* ── SECTION: Driver License & Terms Verification ── */}
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3 border-b border-neutral-200 pb-4">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-950 uppercase tracking-tight">{t("checkout.terms-eligibility")}</h2>
                    <p className="text-[11px] text-neutral-500">{t("checkout.standard-verification-requirements-set")}</p>
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
                      <strong className="text-neutral-950">Original Driving License (LMV):</strong> {t("checkout.i-hold-an-original")}
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
                      <strong className="text-neutral-950">{t("checkout.rental-policy-safety-limit")}</strong> {t("checkout.i-agree-to-srms")}
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
                          ? t("checkout.connecting-razorpay")
                          : t("checkout.securing-hold")}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {paymentMethod === "ONLINE" ? (
                          <>{t("checkout.cta-online", { amount: formatInr(advance.now) })}</>
                        ) : (
                          <>{t("checkout.confirm-reservation")}</>
                        )}
                      </span>
                    )}
                  </Button>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-500">
                    <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
                    {paymentMethod === "ONLINE"
                      ? t("checkout.note-online", { percent: payOpts.advancePercent })
                      : t("checkout.note-pickup")}
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
                  {t("checkout.summary-toggle", { action: summaryOpen ? t("checkout.hide") : t("checkout.show") })}
                </span>
                <span className="text-base font-black text-neutral-950">{formatInr(grandTotal)}</span>
              </button>
              <div className={`${summaryOpen ? "block" : "hidden"} rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-2xl space-y-4 lg:block`}>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-neutral-950 uppercase tracking-tight">{t("checkout.order-summary")}</h3>
                  <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 border border-orange-500/20">
                    {items.length} Car{items.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Car Item Preview */}
                <div className="divide-y divide-neutral-100 py-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-3 space-y-2">
                      <div className="flex items-start gap-3">
                        <CarThumb src={item.carImage} name={item.carName} className="size-16" />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-950">{item.carName}</h4>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <span className="inline-block rounded bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 uppercase border border-orange-200">
                              {item.rentalMode === "HOURLY" ? t("checkout.hourly-rental") : t("checkout.daily-24h")}
                            </span>
                            {item.fuelType && (
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] font-bold text-neutral-600 uppercase">{item.fuelType}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 text-[11px]">
                        <div>
                          <dt className="font-semibold tracking-wider text-neutral-400 uppercase">{t("checkout.pickup")}</dt>
                          <dd className="mt-0.5 flex items-start gap-1 font-medium text-neutral-800">
                            <Calendar className="mt-0.5 size-3 shrink-0 text-orange-500" /> {formatDate(item.pickup)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold tracking-wider text-neutral-400 uppercase">{t("checkout.return")}</dt>
                          <dd className="mt-0.5 flex items-start gap-1 font-medium text-neutral-800">
                            <Calendar className="mt-0.5 size-3 shrink-0 text-orange-500" /> {formatDate(item.drop)}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold tracking-wider text-neutral-400 uppercase">{t("checkout.duration")}</dt>
                          <dd className="mt-0.5 flex items-center gap-1 font-medium text-neutral-800">
                            <Clock className="size-3 shrink-0 text-neutral-400" /> {item.durationText}
                          </dd>
                        </div>
                        {item.includedKm != null && (
                          <div>
                            <dt className="font-semibold tracking-wider text-neutral-400 uppercase">{t("checkout.km-included")}</dt>
                            <dd className="mt-0.5 font-medium text-neutral-800">{item.includedKm} km</dd>
                          </div>
                        )}
                        {item.locationName && (
                          <div className="col-span-2">
                            <dt className="font-semibold tracking-wider text-neutral-400 uppercase">{t("checkout.handover")}</dt>
                            <dd className="mt-0.5 font-medium text-neutral-800">{item.locationName}</dd>
                          </div>
                        )}
                        {(item.insurance || item.extraServices.length > 0) && (
                          <div className="col-span-2">
                            <dt className="font-semibold tracking-wider text-neutral-400 uppercase">{t("checkout.extras")}</dt>
                            <dd className="mt-0.5 font-medium text-neutral-800">
                              {[item.insurance?.name, ...item.extraServices.map((x) => x.name)].filter(Boolean).join(" · ")}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  ))}
                </div>

                {/* ── Exact Order Summary Breakdown ── */}
                <div className="border-t border-neutral-200 pt-3 space-y-3 text-xs sm:text-sm">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">{t("checkout.subtotal")}</span>
                    <span className="font-bold text-neutral-950">{formatInr(effectiveSubtotal)}</span>
                  </div>

                  {/* Free Kms */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">{t("checkout.free-kms")}</span>
                    <span className="font-semibold text-neutral-950">{freeKmsLabel}</span>
                  </div>

                  {/* Delivery Location */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-700">{t("checkout.delivery-location")}</span>
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
                    <span className="font-bold text-neutral-700">{t("checkout.delivery-charge")}</span>
                    <span className="font-bold text-neutral-950">{formatInr(deliveryCharge)}</span>
                  </div>

                  {/* Refundable Deposit */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">{t("checkout.refundable-deposit")}</span>
                    <span className="font-bold text-neutral-950">{formatInr(refundableDeposit)}</span>
                  </div>

                  {/* Coupon Discount (if applied) */}
                  {totalDiscount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-bold">
                      <span>{t("checkout.coupon-discount")}</span>
                      <span>-{formatInr(totalDiscount)}</span>
                    </div>
                  )}

                  {/* Group Divider */}
                  <div className="border-t border-neutral-200 my-2" />

                  {/* Fuel */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">{t("checkout.fuel")}</span>
                    <span className="font-semibold text-neutral-950">{fuelType}</span>
                  </div>

                  {/* Extra kms charge */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-700">{t("checkout.extra-kms-charge")}</span>
                    <span className="font-bold text-neutral-950">{formatInr(extraKmRate)}</span>
                  </div>

                  {/* Group Divider */}
                  <div className="border-t border-neutral-200 my-2" />

                  {/* Grand Total */}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 flex items-center justify-between">
                    <span className="text-sm font-bold text-neutral-900">{t("checkout.grand-total")}</span>
                    <span className="text-lg font-black text-neutral-950">{formatInr(grandTotal)}</span>
                  </div>

                  {/* Group Divider */}
                  <div className="border-t border-neutral-200 my-2" />

                  {/* Payment breakdown */}
                  <div className="rounded-xl border border-orange-500/40 border-l-4 border-l-orange-500 bg-orange-50 p-3.5 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-orange-800">
                      {t("checkout.payable-now")}{paymentMethod === "ONLINE" ? ` (${payOpts.advancePercent}%)` : ""}:
                    </span>
                    <span className="text-lg sm:text-xl font-black text-orange-600">{formatInr(payableNow)}</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/40 border-l-4 border-l-emerald-600 bg-emerald-50 p-3.5 flex items-center justify-between">
                    <span className="text-sm sm:text-base font-bold text-emerald-800">
                      {t("checkout.payable-later")}{paymentMethod === "ONLINE" ? ` (${100 - payOpts.advancePercent}%)` : ""}:
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
                      <strong className="text-neutral-900">{t("checkout.total-includes")}</strong> {t("checkout.subtotal-delivery-refundable-deposit")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Phones: always-visible total + pay button */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
              {paymentMethod === "ONLINE" ? t("checkout.payable-now") : t("checkout.grand-total")}
            </div>
            <div className="truncate text-lg leading-tight font-black text-neutral-950">
              {formatInr(paymentMethod === "ONLINE" ? advance.now : grandTotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmitCheckout}
            disabled={isSubmitting}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 text-sm font-black text-white shadow-lg shadow-orange-500/30 active:scale-95 disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="size-5 animate-spin" />
            ) : paymentMethod === "ONLINE" ? (
              t("checkout.cta-online", { amount: formatInr(advance.now) })
            ) : (
              t("checkout.confirm-reservation")
            )}
          </button>
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
