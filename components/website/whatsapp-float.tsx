"use client";

import * as React from "react";
import { CheckCircle2, Loader2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import type { SiteText } from "@/modules/settings/site-content.schemas";
import { toTenDigits } from "@/lib/car-enquiry/types";
import { DateTimePicker } from "@/components/website/datetime-picker";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20";

const pad2 = (n: number) => String(n).padStart(2, "0");
/** Current local time as "YYYY-MM-DDTHH:mm" (earliest selectable pickup). */
function nowSlot(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Floating "chat on WhatsApp" button. Opens a short form (city, need, contact),
 * saves the lead, then opens WhatsApp on the number configured for the chosen city.
 */
export function WhatsAppFloat({ cities, text }: { cities: string[]; text: SiteText["floatingWhatsApp"] }) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [v, setV] = React.useState({
    city: cities[0] ?? "",
    interest: text.interests[0] ?? "",
    name: "",
    phone: "",
    pickupAt: "",
    notes: "",
    website: "", // honeypot
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((p) => ({ ...p, [k]: k === "phone" ? toTenDigits(e.target.value) : e.target.value }));

  React.useEffect(() => {
    if (!open) return;
    setDone(false);
    const onKey = (e: KeyboardEvent) => {
      // Escape closes the calendar first, not the whole chat
      if (e.key === "Escape" && !document.querySelector("[data-picker-portal]")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (v.phone.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiFetch<{ id: string; whatsappNumber: string }>("/car-enquiries", {
        method: "POST",
        body: {
          source: "FLOATING_WIDGET",
          carName: `General enquiry — ${v.interest}`,
          name: v.name,
          phone: v.phone,
          city: v.city,
          pickupLocation: v.city,
          pickupAt: v.pickupAt,
          notes: v.notes ? `[${v.interest}] ${v.notes}` : `[${v.interest}]`,
          website: v.website,
        },
      });
      setDone(true);
      if (res.whatsappNumber) {
        const lines = [
          "Hello SRM Car Rentals! 👋",
          "",
          `• *City*: ${v.city}`,
          `• *Looking for*: ${v.interest}`,
          v.pickupAt
            ? `• *When*: ${new Date(v.pickupAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`
            : null,
          `• *Name*: ${v.name}`,
          `• *Mobile*: ${v.phone}`,
          v.notes ? `• *Message*: ${v.notes}` : null,
          "",
          `Ref: ${res.id}`,
        ].filter((l): l is string => l !== null);
        window.open(`https://wa.me/${res.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat on WhatsApp"
        className="fixed right-4 bottom-24 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-500/40 transition hover:scale-105 active:scale-95 lg:right-6 lg:bottom-6"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/40" aria-hidden />
        <MessageCircle className="size-7" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:justify-end sm:p-6" role="dialog" aria-modal="true" aria-label="Chat on WhatsApp">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-in slide-in-from-bottom-6 sm:max-w-sm sm:rounded-3xl lg:mb-16">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#128C7E] to-[#25D366] px-5 py-4 text-white">
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/15 hover:bg-black/25">
                <X className="size-4" />
              </button>
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-white/20">
                  <MessageCircle className="size-5" />
                </span>
                <div>
                  <div className="text-sm font-black">{text.title}</div>
                  <div className="text-[11px] text-white/80">{text.subtitle}</div>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-5">
              {done ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <CheckCircle2 className="size-12 text-emerald-500" />
                  <p className="text-sm font-semibold text-neutral-800">{text.successMessage}</p>
                  <button type="button" onClick={() => setOpen(false)} className="mt-1 rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-black text-white">
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
                  <input tabIndex={-1} autoComplete="off" value={v.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" aria-hidden />

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold tracking-wider text-neutral-600 uppercase">City *</span>
                    {cities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cities.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setV((p) => ({ ...p, city: c }))}
                            className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                              v.city === c ? "border-[#25D366] bg-[#25D366] text-white shadow-md shadow-emerald-500/25" : "border-neutral-200 bg-white text-neutral-700 hover:border-[#25D366]/60"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input required value={v.city} onChange={set("city")} placeholder="Your city" className={inputClass} />
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold tracking-wider text-neutral-600 uppercase">I&apos;m looking for *</span>
                    <select value={v.interest} onChange={set("interest")} className={inputClass}>
                      {text.interests.map((i) => (
                        <option key={i}>{i}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold tracking-wider text-neutral-600 uppercase">Name *</span>
                      <input required value={v.name} onChange={set("name")} autoComplete="name" placeholder="Your name" className={inputClass} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-bold tracking-wider text-neutral-600 uppercase">Mobile *</span>
                      <input required type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={v.phone} onChange={set("phone")} autoComplete="tel-national" placeholder="10 digits" className={inputClass} />
                    </label>
                  </div>

                  <div>
                    <span className="mb-1 block text-[11px] font-bold tracking-wider text-neutral-600 uppercase">Pickup date &amp; time</span>
                    <DateTimePicker label="" value={v.pickupAt} onChange={(val) => setV((p) => ({ ...p, pickupAt: val }))} minDateTime={nowSlot()} />
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-bold tracking-wider text-neutral-600 uppercase">Message</span>
                    <textarea rows={2} value={v.notes} onChange={set("notes")} placeholder="Car you like, trip plan, questions…" className={inputClass} />
                  </label>

                  <button
                    type="submit"
                    disabled={submitting || !v.city}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-500/25 transition hover:bg-[#1ebe5a] active:scale-[0.99] disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <MessageCircle className="size-4" /> {text.submitLabel}
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
