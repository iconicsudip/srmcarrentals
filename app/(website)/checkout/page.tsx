"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  Calendar,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck2,
  HelpCircle,
  IdCard,
  Info,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "@/lib/cart/cart-store";
import { ApiRequestError, apiFetch } from "@/lib/api-client";
import { useCurrentUser, useLogin, useLogout, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckoutFieldConfig,
  CheckoutFormSettings,
  DEFAULT_CHECKOUT_SETTINGS,
  validateFieldValue,
} from "@/lib/checkout/checkout-form-settings";

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

  // Authentication hooks
  const { data: currentUser, isLoading: isAuthLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();

  // Active authentication mode when unauthenticated: "GUEST" | "LOGIN"
  const [authMode, setAuthMode] = React.useState<"GUEST" | "LOGIN">("GUEST");

  // Dynamic Checkout Settings from Admin
  const [formSettings, setFormSettings] = React.useState<CheckoutFormSettings>(DEFAULT_CHECKOUT_SETTINGS);

  // Dynamic Form Field Values
  const [formValues, setFormValues] = React.useState<Record<string, any>>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    emergencyPhone: "",
    flightNumber: "",
    deliveryAddress: "",
    gstNumber: "",
    companyName: "",
    handoverNotes: "",
  });

  // Real-time Validations State
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  // B2B GST Invoicing Accordion Toggle
  const [enableGst, setEnableGst] = React.useState(false);

  // Inline Login form state
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // Optional registration during Guest Checkout
  const [createAccount, setCreateAccount] = React.useState(false);
  const [accountPassword, setAccountPassword] = React.useState("");

  // Payment method selection: "PICKUP" (Cash / UPI at handover) or "ONLINE"
  const [paymentMethod, setPaymentMethod] = React.useState<"PICKUP" | "ONLINE">("PICKUP");

  // Legal checks
  const [hasLicense, setHasLicense] = React.useState(true);
  const [agreeTerms, setAgreeTerms] = React.useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Load dynamic checkout configuration from Admin
  React.useEffect(() => {
    let cancelled = false;
    apiFetch<CheckoutFormSettings>("/settings/checkout.form", { skipAuthRedirect: true })
      .then((data) => {
        if (!cancelled && data && data.fields) {
          setFormSettings(data);
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-fill form fields whenever user is authenticated
  React.useEffect(() => {
    if (currentUser) {
      setFormValues((prev) => ({
        ...prev,
        firstName: prev.firstName || currentUser.firstName || "",
        lastName: prev.lastName || currentUser.lastName || "",
        email: prev.email || currentUser.email || "",
        phone: prev.phone || currentUser.phone || "",
      }));
    }
  }, [currentUser]);

  // Handle Real-time Field Input Change & Validation
  const handleFieldChange = (field: CheckoutFieldConfig, value: any) => {
    setFormValues((prev) => ({ ...prev, [field.id]: value }));
    setTouched((prev) => ({ ...prev, [field.id]: true }));

    const res = validateFieldValue(field, value);
    if (!res.valid && res.error) {
      setErrors((prev) => ({ ...prev, [field.id]: res.error! }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field.id];
        return next;
      });
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
        firstName: res.user.firstName,
        lastName: res.user.lastName,
        email: res.user.email,
        phone: res.user.phone || prev.phone,
      }));
      setLoginPassword("");
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Invalid email or password. Please try again.";
      setLoginError(msg);
      toast.error(msg);
    }
  };

  // Handle Checkout Submission with Dynamic Validations
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formSettings.requireLicenseConfirmation && !hasLicense) {
      toast.error("Original Driving License confirmation is mandatory for self-drive vehicle release.");
      return;
    }
    if (formSettings.requireTermsAgreement && !agreeTerms) {
      toast.error("Please accept the rental policy and terms of service.");
      return;
    }

    // Validate all enabled fields
    let hasValidationError = false;
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    for (const field of formSettings.fields) {
      if (!field.enabled) continue;

      // Skip GST fields if GST invoice wasn't requested
      if ((field.id === "gstNumber" || field.id === "companyName") && !enableGst) {
        continue;
      }

      const val = formValues[field.id];
      const validation = validateFieldValue(field, val);
      if (!validation.valid) {
        newErrors[field.id] = validation.error || `${field.label} is required`;
        newTouched[field.id] = true;
        hasValidationError = true;
      }
    }

    if (hasValidationError) {
      setErrors(newErrors);
      setTouched((prev) => ({ ...prev, ...newTouched }));
      toast.error("Please correct the highlighted form errors before proceeding.");
      return;
    }

    setIsSubmitting(true);

    try {
      // If user chose to register an account inline during guest checkout
      let registeredUserId = currentUser?.id;
      if (!currentUser && createAccount) {
        if (!accountPassword || accountPassword.length < 8) {
          toast.error("Password must be at least 8 characters to create an account.");
          setIsSubmitting(false);
          return;
        }

        try {
          const regRes = await registerMutation.mutateAsync({
            firstName: formValues.firstName.trim(),
            lastName: formValues.lastName.trim(),
            email: formValues.email.trim().toLowerCase(),
            phone: formValues.phone.trim(),
            password: accountPassword,
          });
          registeredUserId = regRes.user.id;
          toast.success("Account created and signed in!");
        } catch (regErr) {
          const msg = regErr instanceof ApiRequestError ? regErr.message : "Account registration skipped.";
          toast.info(msg);
        }
      }

      const primaryItem = items[0];
      if (!primaryItem) throw new Error("No vehicle found in cart.");

      const payload = {
        carId: primaryItem.carId,
        customerId: currentUser?.customerId,
        customer: {
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
          phone: formValues.phone.trim(),
          email: formValues.email.trim().toLowerCase(),
          userId: registeredUserId,
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

  const isAirportDelivery = items.some((i) => i.deliveryType === "AIRPORT");

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
              {/* SECTION 1: Customer Contact & Checkout Mode (Guest vs Logged In) */}
              <div className="rounded-3xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur shadow-xl">
                {currentUser ? (
                  /* ==============================================================
                     LOGGED-IN MEMBER VIEW
                     ============================================================== */
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <UserCheck className="size-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-white uppercase tracking-tight">1. Member Contact Details</h2>
                            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                              ✓ Verified Member
                            </span>
                          </div>
                          <p className="text-[11px] text-white/60">
                            Signed in as <strong className="text-white">{currentUser.firstName} {currentUser.lastName}</strong> ({currentUser.email})
                          </p>
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

                    <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                      <Sparkles className="size-4 shrink-0 text-emerald-400" />
                      <span>
                        Your saved member profile is pre-filled below. This reservation will be automatically linked to your account.
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ==============================================================
                     UNAUTHENTICATED: GUEST CHECKOUT VS LOGIN TOGGLE
                     ============================================================== */
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                          <User className="size-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white uppercase tracking-tight">1. Checkout Method</h2>
                          <p className="text-[11px] text-white/50">Proceed as a guest or sign in for 1-click member checkout.</p>
                        </div>
                      </div>
                    </div>

                    {/* Mode Segmented Control */}
                    <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/60 p-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("GUEST");
                          setLoginError(null);
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${authMode === "GUEST"
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <User className="size-4" />
                        <span>Guest Checkout</span>
                        <span className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-200">
                          Fastest
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthMode("LOGIN")}
                        className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${authMode === "LOGIN"
                          ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                          }`}
                      >
                        <LogIn className="size-4" />
                        <span>Login to Checkout</span>
                        <span className="rounded bg-black/30 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-orange-200">
                          Members
                        </span>
                      </button>
                    </div>

                    {/* INLINE LOGIN FORM */}
                    {authMode === "LOGIN" && (
                      <div className="mt-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 animate-in fade-in zoom-in-95">
                        <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
                          <LogIn className="size-4" /> Sign In to Your SRM Account
                        </div>
                        <p className="mt-1 text-[11px] text-white/60">
                          Log in with your email and password to instantly pre-fill your saved details and link this reservation.
                        </p>

                        <form onSubmit={handleInlineLogin} className="mt-4 space-y-3">
                          {loginError && (
                            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                              <AlertCircle className="size-4 shrink-0 text-red-400" />
                              <span>{loginError}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <Label className="text-xs font-semibold text-white/70">Email Address</Label>
                              <Input
                                required
                                type="email"
                                placeholder="name@example.com"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                className="mt-1 rounded-xl border-white/10 bg-black/60 text-xs text-white"
                              />
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-white/70">Password</Label>
                              <Input
                                required
                                type="password"
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="mt-1 rounded-xl border-white/10 bg-black/60 text-xs text-white"
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setAuthMode("GUEST")}
                              className="text-xs text-orange-400/80 hover:text-orange-300 underline"
                            >
                              Don&apos;t have an account? Continue as Guest →
                            </button>

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
                                <span className="flex items-center gap-1.5">
                                  <LogIn className="size-3.5" /> Sign In & Pre-fill
                                </span>
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* DYNAMIC FORM FIELDS WITH REAL-TIME VALIDATION */}
                {(currentUser || authMode === "GUEST") && (
                  <div className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {formSettings.fields
                        .filter(
                          (f) =>
                            f.enabled &&
                            f.id !== "gstNumber" &&
                            f.id !== "companyName" &&
                            f.id !== "handoverNotes",
                        )
                        .map((field) => {
                          const val = formValues[field.id] || "";
                          const hasError = Boolean(errors[field.id]);
                          const isSuccess = touched[field.id] && !hasError && Boolean(val);
                          const isAirportHighlight = field.id === "flightNumber" && isAirportDelivery;

                          return (
                            <div
                              key={field.id}
                              className={
                                field.id === "flightNumber" || field.id === "deliveryAddress"
                                  ? "sm:col-span-2"
                                  : ""
                              }
                            >
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                                  {field.label}
                                  {field.required ? (
                                    <span className="text-orange-400 font-bold">*</span>
                                  ) : (
                                    <span className="text-white/40 text-[10px] font-normal">(Optional)</span>
                                  )}
                                </Label>

                                {isAirportHighlight && (
                                  <span className="rounded bg-orange-500/20 px-1.5 py-0.2 text-[9px] font-bold text-orange-400 flex items-center gap-1">
                                    <Plane className="size-2.5" /> Airport Pickup Selected
                                  </span>
                                )}

                                {isSuccess && (
                                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                    <Check className="size-3" /> Valid
                                  </span>
                                )}
                              </div>

                              <div className="relative mt-1.5">
                                <Input
                                  type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
                                  placeholder={field.placeholder || `Enter ${field.label}`}
                                  value={val}
                                  onChange={(e) => handleFieldChange(field, e.target.value)}
                                  onBlur={() => handleFieldChange(field, val)}
                                  className={`rounded-xl border bg-black/40 text-xs text-white placeholder:text-white/30 transition-all ${hasError
                                    ? "border-red-500/80 focus-visible:ring-red-500/30"
                                    : isSuccess
                                      ? "border-emerald-500/60 focus-visible:ring-emerald-500/30"
                                      : "border-white/10 hover:border-white/20"
                                    }`}
                                />
                              </div>

                              {hasError ? (
                                <p className="mt-1 text-[11px] text-red-400 flex items-center gap-1 animate-in fade-in">
                                  <AlertCircle className="size-3 shrink-0" /> {errors[field.id]}
                                </p>
                              ) : (
                                field.helpText && (
                                  <p className="mt-1 text-[10px] text-white/40">{field.helpText}</p>
                                )
                              )}
                            </div>
                          );
                        })}
                    </div>

                    {/* B2B GST Invoicing Toggle & Fields */}
                    {formSettings.enableGstBilling && (
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 transition-all">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={enableGst}
                            onChange={(e) => setEnableGst(e.target.checked)}
                            className="mt-0.5 accent-orange-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Receipt className="size-3.5 text-orange-400" />
                              Need GST Invoice for Business Tax Credit (Input ITC)?
                            </span>
                            <p className="mt-0.5 text-[11px] text-white/50">
                              Claim 18% GST input credit on your corporate car rental invoice.
                            </p>
                          </div>
                        </label>

                        {enableGst && (
                          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                            <div>
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-white/80">Company GSTIN *</Label>
                                {touched["gstNumber"] && !errors["gstNumber"] && formValues.gstNumber && (
                                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                                    <Check className="size-3" /> Valid GSTIN
                                  </span>
                                )}
                              </div>
                              <Input
                                placeholder="e.g. 08AAAAA0000A1Z5"
                                value={formValues.gstNumber}
                                onChange={(e) =>
                                  handleFieldChange(
                                    {
                                      id: "gstNumber",
                                      label: "Company GSTIN",
                                      required: true,
                                      enabled: true,
                                      isSystem: true,
                                      type: "text",
                                      validationRule: "gstin",
                                      category: "business",
                                    },
                                    e.target.value.toUpperCase(),
                                  )
                                }
                                className={`mt-1 rounded-xl border bg-black/60 text-xs text-white uppercase ${errors["gstNumber"] ? "border-red-500" : "border-white/10"
                                  }`}
                              />
                              {errors["gstNumber"] && (
                                <p className="mt-1 text-[10px] text-red-400">{errors["gstNumber"]}</p>
                              )}
                            </div>

                            <div>
                              <Label className="text-xs font-semibold text-white/80">Company Legal Name *</Label>
                              <Input
                                placeholder="e.g. Acme Technologies Pvt Ltd"
                                value={formValues.companyName}
                                onChange={(e) =>
                                  handleFieldChange(
                                    {
                                      id: "companyName",
                                      label: "Company Name",
                                      required: true,
                                      enabled: true,
                                      isSystem: true,
                                      type: "text",
                                      validationRule: "none",
                                      category: "business",
                                    },
                                    e.target.value,
                                  )
                                }
                                className="mt-1 rounded-xl border-white/10 bg-black/60 text-xs text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Special Handover Notes */}
                    {formSettings.fields.find((f) => f.id === "handoverNotes" && f.enabled) && (
                      <div>
                        <Label className="text-xs font-semibold text-white/80">
                          Handover Notes / Special Requests (Optional)
                        </Label>
                        <Input
                          placeholder="e.g. Flight 6E-243 arriving Udaipur 11:30 AM / Need baby child seat"
                          value={formValues.handoverNotes}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, handoverNotes: e.target.value }))
                          }
                          className="mt-1.5 rounded-xl border-white/10 bg-black/40 text-xs text-white placeholder:text-white/30"
                        />
                      </div>
                    )}

                    {/* Optional Account Creation Toggle for Guests */}
                    {!currentUser && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4 transition-all hover:border-white/20">
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={createAccount}
                            onChange={(e) => setCreateAccount(e.target.checked)}
                            className="mt-0.5 accent-orange-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <Sparkles className="size-3.5 text-orange-400" />
                              Save my details & create an SRM account
                            </span>
                            <p className="mt-0.5 text-[11px] text-white/50">
                              Enables 1-click reservations, easy digital voucher retrieval, and special repeat-renter discounts.
                            </p>
                          </div>
                        </label>

                        {createAccount && (
                          <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in">
                            <div className="sm:col-span-2">
                              <Label className="text-xs font-semibold text-white/70 flex items-center gap-1">
                                <KeyRound className="size-3 text-orange-400" /> Create Account Password *
                              </Label>
                              <Input
                                type="password"
                                placeholder="Choose a password (min 8 characters)"
                                value={accountPassword}
                                onChange={(e) => setAccountPassword(e.target.value)}
                                className="mt-1 rounded-xl border-white/10 bg-black/60 text-xs text-white"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${paymentMethod === "PICKUP"
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
                    className={`relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all ${paymentMethod === "ONLINE"
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
                  {formSettings.requireLicenseConfirmation && (
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
                  )}

                  {formSettings.requireTermsAgreement && (
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/30 p-3 text-xs text-white/80 transition hover:bg-black/50">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 accent-orange-500"
                      />
                      <span>
                        <strong className="text-white">Rental Policy & Safety Limit:</strong> I agree to SRM&apos;s rental agreement, speed limit compliance (80 km/h), driver age requirements (min {formSettings.minimumDriverAge}+ years), and understand that a refundable security deposit (₹3,000–₹5,000) is collected at vehicle pickup.
                      </span>
                    </label>
                  )}
                </div>

                {/* Primary Submit Button */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleSubmitCheckout}
                    disabled={isSubmitting || (!currentUser && authMode === "LOGIN")}
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
            </div>
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
