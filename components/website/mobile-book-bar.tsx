"use client";

import * as React from "react";
import { CalendarCheck, MessageCircle, Phone } from "lucide-react";

/** Phone-only sticky bar: jumps to the booking panel, hides itself once it is on screen. */
function scrollToBooking(targetId: string) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Phone-only call-to-action card placed right under the gallery, so booking is never "somewhere below". */
export function MobileQuickBook({
  carName,
  price,
  phone,
  whatsappNumber,
  targetId = "book",
}: {
  carName: string;
  price: string;
  phone: string;
  /** City-routed WhatsApp number (digits, with country code). Falls back to `phone`. */
  whatsappNumber?: string;
  targetId?: string;
}) {
  const digits = phone.replace(/[^0-9]/g, "");
  const waDigits = whatsappNumber || (digits.length === 10 ? `91${digits}` : digits);
  const wa = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hello SRM Car Rentals! I'm interested in booking the ${carName}. Please share availability.`)}`
    : "";
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-800 p-5 text-white shadow-xl shadow-neutral-900/20 lg:hidden">
      <div className="pointer-events-none absolute -top-14 -right-10 size-44 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.45),transparent_65%)]" />
      <div className="relative">
        <div className="flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-amber-300 uppercase">Book this car</span>
            <div className="mt-1 text-2xl leading-none font-black text-white">{price}</div>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
            Pay 30% to reserve
          </span>
        </div>

        <ol className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-white/70">
          {["Pick dates", "Choose pickup", "Reserve"].map((step, i) => (
            <React.Fragment key={step}>
              <li className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-neutral-950">{i + 1}</span>
                {step}
              </li>
              {i < 2 && <span className="h-px flex-1 bg-white/20" />}
            </React.Fragment>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => scrollToBooking(targetId)}
          className="shimmer-sheen relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/30 active:scale-[0.98]"
        >
          <CalendarCheck className="size-4" /> Select dates &amp; book
        </button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3 text-xs font-black text-white"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          )}
          {digits && (
            <a
              href={`tel:+${digits}`}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-3 text-xs font-black text-white"
            >
              <Phone className="size-4" /> Call now
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/** Phone-only sticky bar: jumps to the booking panel, hides itself once it is on screen. */
export function MobileBookBar({ label, price, targetId = "book" }: { label: string; price: string; targetId?: string }) {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry?.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neutral-950/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-white/70">{label}</div>
          <div className="text-lg leading-tight font-black text-amber-300">{price}</div>
        </div>
        <button
          type="button"
          onClick={() => scrollToBooking(targetId)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-500/30 active:scale-95"
        >
          <CalendarCheck className="size-4" /> Book Now
        </button>
      </div>
    </div>
  );
}
