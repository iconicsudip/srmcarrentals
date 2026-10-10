"use client";

import * as React from "react";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api-client";
import { toTenDigits } from "@/lib/car-enquiry/types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20";

const asLocalInput = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) ? v.slice(0, 16) : "");

const fmt = (v: string) =>
  new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export interface CarWhatsAppTarget {
  id: string;
  slug: string;
  name: string;
  priceLabel?: string;
}

/** "Book on WhatsApp" — collects the booking details, saves them as an enquiry, then opens the chat. */
export function CarWhatsAppBook({
  car,
  pickupDate,
  dropDate,
  pickupLocation,
  className,
  label = "WhatsApp",
}: {
  car: CarWhatsAppTarget;
  pickupDate?: string;
  dropDate?: string;
  pickupLocation?: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [v, setV] = React.useState({
    name: "",
    phone: "",
    email: "",
    pickupAt: asLocalInput(pickupDate),
    dropAt: asLocalInput(dropDate),
    pickupLocation: pickupLocation ?? "",
    notes: "",
    website: "", // honeypot
  });
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: k === "phone" ? toTenDigits(e.target.value) : e.target.value }));

  React.useEffect(() => {
    if (open) setDone(false);
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
        body: { carId: car.id, carSlug: car.slug, carName: car.name, ...v },
      });
      setDone(true);
      toast.success("Request saved! Opening WhatsApp…");

      if (res.whatsappNumber) {
        const lines = [
          "Hello SRM Car Rentals! 👋",
          "",
          "I'd like to book this car:",
          "",
          `• *Car*: ${car.name}`,
          car.priceLabel ? `• *Rate*: ${car.priceLabel}` : null,
          v.pickupAt ? `• *Pickup*: ${fmt(v.pickupAt)}` : null,
          v.dropAt ? `• *Drop*: ${fmt(v.dropAt)}` : null,
          v.pickupLocation ? `• *Location*: ${v.pickupLocation}` : null,
          `• *Name*: ${v.name}`,
          `• *Mobile*: ${v.phone}`,
          v.notes ? `• *Notes*: ${v.notes}` : null,
          "",
          `Ref: ${res.id}`,
          "Please confirm availability!",
        ].filter((l): l is string => l !== null);
        window.open(
          `https://wa.me/${res.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-xs font-black text-white shadow-md shadow-emerald-500/25 transition hover:bg-[#1ebe5a] active:scale-95 cursor-pointer whitespace-nowrap"
        }
      >
        <MessageCircle className="size-4" />
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-neutral-200 bg-white text-neutral-900 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-neutral-950">Book on WhatsApp</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Share your details — we save your request and continue the chat on WhatsApp.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 px-4 py-3 text-sm">
            <div className="font-black text-neutral-950">{car.name}</div>
            {car.priceLabel && <div className="text-xs text-neutral-500">{car.priceLabel}</div>}
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="size-12 text-emerald-500" />
              <p className="max-w-sm text-sm font-semibold text-neutral-800">
                Thank you! Your request is saved. Continue on WhatsApp to confirm — we&apos;ll reply shortly.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-xl bg-neutral-900 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* honeypot */}
              <input
                tabIndex={-1}
                autoComplete="off"
                value={v.website}
                onChange={set("website")}
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                aria-hidden
              />
              <Field label="Full Name" required>
                <input required value={v.name} onChange={set("name")} placeholder="Your name" className={inputClass} />
              </Field>
              <Field label="Mobile Number" required>
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={v.phone}
                  onChange={set("phone")}
                  placeholder="10-digit mobile number"
                  className={inputClass}
                />
              </Field>
              <Field label="Pickup Date & Time" required>
                <input required type="datetime-local" value={v.pickupAt} onChange={set("pickupAt")} className={inputClass} />
              </Field>
              <Field label="Drop Date & Time" required>
                <input required type="datetime-local" value={v.dropAt} min={v.pickupAt || undefined} onChange={set("dropAt")} className={inputClass} />
              </Field>
              <Field label="Pickup Location / City" className="sm:col-span-2">
                <input value={v.pickupLocation} onChange={set("pickupLocation")} placeholder="Branch, airport, hotel…" className={inputClass} />
              </Field>
              <Field label="Email (optional)" className="sm:col-span-2">
                <input type="email" value={v.email} onChange={set("email")} placeholder="you@example.com" className={inputClass} />
              </Field>
              <Field label="Special Requests" className="sm:col-span-2">
                <textarea rows={2} value={v.notes} onChange={set("notes")} placeholder="Child seat, delivery address…" className={inputClass} />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="sm:col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-500/25 transition hover:bg-[#1ebe5a] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <MessageCircle className="size-4" /> Save &amp; Continue on WhatsApp
                  </>
                )}
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-neutral-600">
        {label}
        {required && <span className="text-orange-600"> *</span>}
      </span>
      {children}
    </label>
  );
}
