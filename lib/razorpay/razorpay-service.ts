import crypto from "crypto";
import { getSetting, setSetting } from "@/modules/settings/settings.service";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  enabled: boolean;
  mode: "test" | "live";
}

export interface SmartPaymentLink {
  id: string;
  razorpayLinkId?: string;
  shortUrl: string;
  amount: number;
  currency: string;
  purpose: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  bookingReference?: string;
  bookingId?: string;
  status: "ISSUED" | "PAID" | "PARTIALLY_PAID" | "EXPIRED" | "CANCELLED";
  allowPartial: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  expiresAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

const SMART_LINKS_SETTING_KEY = "razorpay.smart_links";

export async function getRazorpayConfig(): Promise<RazorpayConfig> {
  const paymentSetting = await getSetting<Record<string, any>>("system.payment");

  const keyId =
    paymentSetting?.razorpayKeyId ||
    process.env.RAZORPAY_KEY_ID ||
    "";
  const keySecret =
    paymentSetting?.razorpayKeySecret ||
    process.env.RAZORPAY_KEY_SECRET ||
    "";
  const webhookSecret =
    paymentSetting?.razorpayWebhookSecret ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    "";
  const enabled = paymentSetting?.enableRazorpay !== false;

  const mode = keyId.startsWith("rzp_live_") ? "live" : "test";

  return {
    keyId: keyId.trim(),
    keySecret: keySecret.trim(),
    webhookSecret: webhookSecret.trim(),
    enabled,
    mode,
  };
}

function getBasicAuthHeader(keyId: string, keySecret: string): string {
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

export async function testRazorpayConnection(): Promise<{
  success: boolean;
  message: string;
  mode: "test" | "live";
  keyId: string;
}> {
  const config = await getRazorpayConfig();

  if (!config.keyId || !config.keySecret) {
    return {
      success: false,
      message: "Razorpay Key ID or Secret is not configured. Please enter your API keys in Settings.",
      mode: config.mode,
      keyId: config.keyId,
    };
  }

  try {
    const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
      headers: {
        Authorization: getBasicAuthHeader(config.keyId, config.keySecret),
      },
    });

    if (res.ok) {
      return {
        success: true,
        message: `Successfully connected to Razorpay in ${config.mode.toUpperCase()} mode!`,
        mode: config.mode,
        keyId: config.keyId,
      };
    }

    const err = await res.json().catch(() => ({}));
    return {
      success: false,
      message: err.error?.description || `Authentication failed (HTTP ${res.status}). Verify your Key Secret.`,
      mode: config.mode,
      keyId: config.keyId,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || "Failed to reach Razorpay API servers.",
      mode: config.mode,
      keyId: config.keyId,
    };
  }
}

export async function listSmartLinks(): Promise<SmartPaymentLink[]> {
  const links = await getSetting<SmartPaymentLink[]>(SMART_LINKS_SETTING_KEY);
  if (!Array.isArray(links)) return [];
  return links;
}

export async function saveSmartLinks(links: SmartPaymentLink[]) {
  await setSetting(SMART_LINKS_SETTING_KEY, links);
}

export function formatCustomerPhoneForRazorpay(phone?: string): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (phone.trim().startsWith("+")) {
    return phone.trim().replace(/\s+/g, "");
  }
  return `+${digits}`;
}

export async function createSmartPaymentLink(params: {
  amount: number;
  purpose: string;
  /** Longer text for Razorpay's payment page / SMS / e-mail (defaults to `purpose`). */
  description?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  bookingReference?: string;
  bookingId?: string;
  expireInMinutes?: number;
  allowPartial?: boolean;
  notifySms?: boolean;
  notifyEmail?: boolean;
  callbackUrl?: string;
  callbackMethod?: "get" | "post";
  origin?: string;
}): Promise<SmartPaymentLink> {
  const config = await getRazorpayConfig();
  const id = `plink_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date();
  const expiresAt = params.expireInMinutes
    ? new Date(now.getTime() + params.expireInMinutes * 60_000).toISOString()
    : undefined;

  let shortUrl = "";
  let razorpayLinkId = undefined;

  const formattedPhone = formatCustomerPhoneForRazorpay(params.customerPhone);
  const hasPhone = Boolean(formattedPhone && formattedPhone.length >= 10);

  // If Razorpay API credentials are configured, create live Payment Link on Razorpay
  if (config.keyId && config.keySecret) {
    try {
      const expireByEpoch = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : undefined;
      const callbackUrl =
        params.callbackUrl ||
        (params.bookingReference
          ? `${(params.origin || process.env.NEXT_PUBLIC_APP_URL || "https://srmcarrentals.com").replace(/\/$/, "")}/booking/${params.bookingReference}?payment_status=completed`
          : undefined);

      const rzpRequestBody: Record<string, any> = {
        amount: Math.round(params.amount * 100), // In paise
        currency: "INR",
        accept_partial: Boolean(params.allowPartial),
        description: params.description || params.purpose,
        customer: {
          name: params.customerName,
          email: params.customerEmail || undefined,
          contact: hasPhone ? formattedPhone : undefined,
        },
        notify: {
          sms: params.notifySms !== undefined ? Boolean(params.notifySms) : hasPhone,
          email: params.notifyEmail !== undefined ? Boolean(params.notifyEmail) : Boolean(params.customerEmail),
        },
        reminder_enable: true,
        expire_by: expireByEpoch,
        notes: {
          bookingReference: params.bookingReference || "",
          bookingId: params.bookingId || "",
          purpose: params.purpose,
          platform: "SRM Car Rentals",
          customerPhone: params.customerPhone || "",
        },
      };

      if (callbackUrl) {
        rzpRequestBody.callback_url = callbackUrl;
        rzpRequestBody.callback_method = params.callbackMethod || "get";
      }

      if (hasPhone || params.customerEmail || params.customerName) {
        rzpRequestBody.options = {
          checkout: {
            name: "SRM Car Rentals",
            prefill: {
              contact: hasPhone ? formattedPhone : undefined,
              email: params.customerEmail || undefined,
              name: params.customerName || undefined,
            },
          },
        };
      }

      const rzpRes = await fetch("https://api.razorpay.com/v1/payment_links", {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(config.keyId, config.keySecret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rzpRequestBody),
      });

      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        razorpayLinkId = rzpData.id;
        shortUrl = rzpData.short_url;
      } else {
        const errData = await rzpRes.json().catch(() => ({}));
        console.error("Razorpay Payment Link creation error:", rzpRes.status, errData);
      }
    } catch (err) {
      console.error("Failed to connect to Razorpay API for payment link:", err);
    }
  }

  // Fallback to internal custom payment portal URL
  if (!shortUrl) {
    const origin = params.origin || (process.env.NEXT_PUBLIC_APP_URL || "https://srmcarrentals.com");
    shortUrl = `${origin.replace(/\/$/, "")}/pay/${id}`;
  }

  const newLink: SmartPaymentLink = {
    id,
    razorpayLinkId,
    shortUrl,
    amount: params.amount,
    currency: "INR",
    purpose: params.purpose,
    customerName: params.customerName,
    customerPhone: formattedPhone || params.customerPhone,
    customerEmail: params.customerEmail,
    bookingReference: params.bookingReference,
    bookingId: params.bookingId,
    status: "ISSUED",
    allowPartial: Boolean(params.allowPartial),
    notifySms: params.notifySms !== undefined ? Boolean(params.notifySms) : hasPhone,
    notifyEmail: params.notifyEmail !== undefined ? Boolean(params.notifyEmail) : Boolean(params.customerEmail),
    expiresAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const existing = await listSmartLinks();
  await saveSmartLinks([newLink, ...existing]);

  return newLink;
}

export async function cancelSmartPaymentLink(id: string): Promise<boolean> {
  const links = await listSmartLinks();
  const index = links.findIndex((l) => l.id === id || l.razorpayLinkId === id);
  if (index === -1) return false;

  const target = links[index]!;
  const config = await getRazorpayConfig();

  if (target.razorpayLinkId && config.keyId && config.keySecret) {
    try {
      await fetch(`https://api.razorpay.com/v1/payment_links/${target.razorpayLinkId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(config.keyId, config.keySecret),
        },
      });
    } catch {}
  }

  target.status = "CANCELLED";
  target.updatedAt = new Date().toISOString();
  links[index] = target;
  await saveSmartLinks(links);

  return true;
}

export async function resendSmartPaymentLink(id: string, medium: "sms" | "email"): Promise<boolean> {
  const links = await listSmartLinks();
  const target = links.find((l) => l.id === id || l.razorpayLinkId === id);
  if (!target || !target.razorpayLinkId) return false;

  const config = await getRazorpayConfig();
  if (!config.keyId || !config.keySecret) return false;

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${target.razorpayLinkId}/notify_by/${medium}`, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(config.keyId, config.keySecret),
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function syncSmartPaymentLinkStatus(id: string): Promise<SmartPaymentLink | null> {
  const links = await listSmartLinks();
  const index = links.findIndex((l) => l.id === id || l.razorpayLinkId === id);
  if (index === -1) return null;

  const target = links[index]!;
  const config = await getRazorpayConfig();

  if (target.razorpayLinkId && config.keyId && config.keySecret) {
    try {
      const res = await fetch(`https://api.razorpay.com/v1/payment_links/${target.razorpayLinkId}`, {
        headers: {
          Authorization: getBasicAuthHeader(config.keyId, config.keySecret),
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.status === "paid") {
          target.status = "PAID";
          target.paidAt = new Date().toISOString();
        } else if (data.status === "partially_paid") {
          target.status = "PARTIALLY_PAID";
        } else if (data.status === "expired") {
          target.status = "EXPIRED";
        } else if (data.status === "cancelled") {
          target.status = "CANCELLED";
        }
        target.updatedAt = new Date().toISOString();
        links[index] = target;
        await saveSmartLinks(links);
      }
    } catch {}
  }

  return target;
}

/** Our stored reference may be a Razorpay payment id (pay_…) or a payment-link id (plink_…); returns the pay_… id. */
export async function resolveRazorpayPaymentId(ref?: string | null): Promise<string | null> {
  if (!ref) return null;
  if (ref.startsWith("pay_") && !/^pay_rzp_\d+$/.test(ref)) return ref;
  const config = await getRazorpayConfig();
  if (!config.keyId || !config.keySecret) return null;
  // Payment-link reference: ask Razorpay which payment settled it
  const links = await listSmartLinks();
  const linkId = ref.startsWith("plink_") ? ref : links.find((l) => l.id === ref)?.razorpayLinkId;
  if (!linkId) return null;
  try {
    const res = await fetch(`https://api.razorpay.com/v1/payment_links/${linkId}`, {
      headers: { Authorization: getBasicAuthHeader(config.keyId, config.keySecret) },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { payments?: { payment_id?: string; status?: string }[] };
    return data.payments?.find((p) => p.status === "captured")?.payment_id ?? data.payments?.[0]?.payment_id ?? null;
  } catch {
    return null;
  }
}

export async function processRazorpayRefund(params: {
  paymentId: string;
  amount: number;
  reason?: string;
  speed?: "normal" | "optimum";
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const config = await getRazorpayConfig();

  if (!config.keyId || !config.keySecret) {
    return {
      success: false,
      error: "Razorpay Key ID and Secret not configured.",
    };
  }

  try {
    const res = await fetch(`https://api.razorpay.com/v1/payments/${params.paymentId}/refund`, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(config.keyId, config.keySecret),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100),
        speed: params.speed || "normal",
        notes: {
          reason: params.reason || "Deposit refund",
          platform: "SRM Car Rentals",
        },
      }),
    });

    const data = await res.json();
    if (res.ok) {
      return {
        success: true,
        refundId: data.id,
      };
    }

    return {
      success: false,
      error: data.error?.description || "Refund request failed.",
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to communicate with Razorpay.",
    };
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}
