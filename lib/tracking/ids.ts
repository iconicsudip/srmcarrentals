/** Pulls the verification code out of whatever was pasted: just the code, or the whole <meta …> tag Google shows. */
export function parseSearchConsoleCode(input?: string | null): string {
  const raw = (input ?? "").trim();
  if (!raw) return "";
  const m = raw.match(/content\s*=\s*["']([^"']+)["']/i);
  return (m?.[1] ?? raw).trim();
}

/** Meta Pixel ids are 15–16 digits. Returns "" if it does not look like one. */
export function cleanPixelId(input?: string | null): string {
  const d = (input ?? "").replace(/\D/g, "");
  return d.length >= 8 && d.length <= 20 ? d : "";
}

/** GA4 measurement ids look like G-XXXXXXXXXX. */
export function cleanGaId(input?: string | null): string {
  const v = (input ?? "").trim().toUpperCase();
  return /^G-[A-Z0-9]{6,}$/.test(v) ? v : "";
}
