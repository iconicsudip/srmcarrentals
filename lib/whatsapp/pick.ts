/** Client-safe helpers for city-wise WhatsApp routing. */
export interface WhatsAppNumbers {
  /** Used when a city has no dedicated number. Digits only (with country code if provided). */
  defaultNumber: string;
  cities: { city: string; number: string }[];
}

export const digitsOnly = (v?: string | null) => (v ?? "").replace(/[^0-9]/g, "");

/** wa.me needs a country code: a bare 10-digit Indian number gets 91 prepended. */
export function toWaNumber(v?: string | null): string {
  const d = digitsOnly(v);
  return d.length === 10 ? `91${d}` : d;
}

const norm = (s?: string | null) => (s ?? "").trim().toLowerCase();

/** Number for a city (case-insensitive), falling back to the default number. */
export function pickWhatsAppNumber(numbers: WhatsAppNumbers | null | undefined, city?: string | null): string {
  if (!numbers) return "";
  const hit = numbers.cities.find((c) => norm(c.city) === norm(city) && digitsOnly(c.number));
  return toWaNumber(hit?.number || numbers.defaultNumber);
}
