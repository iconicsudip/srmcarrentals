import { z } from "zod";

/**
 * Phone numbers (Indian mobiles): one set of rules for every form and for the server.
 *  - a +91 / 91 / 0 prefix is accepted and removed
 *  - exactly 10 digits, starting with 6, 7, 8 or 9
 *  - obvious fakes (0000000000, 9999999999, 1234567890…) are refused
 */

/** Digits only, without a pasted country code or leading 0, at most 10 digits — for use while typing. */
export function normalizeIndianMobile(input?: string | null): string {
  let digits = (input ?? "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export interface PhoneCheck {
  valid: boolean;
  /** The clean 10-digit number (what should be saved) */
  normalized: string;
  error?: string;
}

const SEQUENTIAL = new Set(["1234567890", "0123456789", "9876543210"]);

export function validateIndianMobile(input?: string | null): PhoneCheck {
  const raw = (input ?? "").trim();
  const normalized = normalizeIndianMobile(raw);
  if (!raw) return { valid: false, normalized, error: "Mobile number is required" };
  if (/[^\d\s+()\-.]/.test(raw)) return { valid: false, normalized, error: "Use digits only" };
  // count what was typed so that 11+ digits (not a 91/0 prefix) are not silently cut down to 10
  const typedDigits = raw.replace(/\D/g, "");
  const prefixOk = typedDigits.length === 10 || (typedDigits.length === 12 && typedDigits.startsWith("91")) || (typedDigits.length === 11 && typedDigits.startsWith("0"));
  if (!prefixOk) {
    return { valid: false, normalized, error: typedDigits.length < 10 ? `Enter all 10 digits (${typedDigits.length} entered)` : "Enter a 10-digit mobile number (without extra digits)" };
  }
  if (!/^[6-9]/.test(normalized)) return { valid: false, normalized, error: "An Indian mobile number starts with 6, 7, 8 or 9" };
  if (/^(\d)\1{9}$/.test(normalized) || SEQUENTIAL.has(normalized)) return { valid: false, normalized, error: "Enter your real mobile number" };
  return { valid: true, normalized };
}

/** Required phone for zod schemas: validates, then saves the clean 10-digit form. */
export const phoneSchema = z
  .string()
  .superRefine((v, ctx) => {
    const r = validateIndianMobile(v);
    if (!r.valid) ctx.addIssue({ code: "custom", message: r.error ?? "Invalid mobile number" });
  })
  .transform((v) => normalizeIndianMobile(v))
  // (the pipe keeps the field required in the inferred type)
  .pipe(z.string());

/** Optional phone for zod schemas: empty is fine, anything else must be valid. */
export const optionalPhoneSchema = z
  .string()
  .optional()
  .superRefine((v, ctx) => {
    if (!v || !v.trim()) return;
    const r = validateIndianMobile(v);
    if (!r.valid) ctx.addIssue({ code: "custom", message: r.error ?? "Invalid mobile number" });
  })
  .transform((v) => (v && v.trim() ? normalizeIndianMobile(v) : undefined));
