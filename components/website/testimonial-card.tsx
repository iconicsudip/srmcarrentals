"use client";

import * as React from "react";
import Image from "next/image";
import { Quote, Star, User } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface TestimonialData {
  id: string;
  customerName: string;
  location: string | null;
  avatarUrl: string | null;
  rating: number;
  quote: string;
  bookedItem: string | null;
  source?: string | null;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-white/15 text-white/15"}`}
        />
      ))}
    </div>
  );
}

export function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function TestimonialCard({ t }: { t: TestimonialData }) {
  const isGoogle = t.source === "google";
  const quoteRef = React.useRef<HTMLQuoteElement>(null);
  const [truncated, setTruncated] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  // Show "… View" only when the clamped text really overflows
  React.useLayoutEffect(() => {
    const el = quoteRef.current;
    if (el) setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [t.quote]);

  return (
    <figure className="group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-4 shadow-xl shadow-black/30 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-amber-400/40 hover:shadow-orange-500/10">
      {/* gold hairline + glow on hover */}
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
      <span className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.22),transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* oversized quote mark */}
      <Quote className="absolute top-3.5 right-3.5 size-8 rotate-180 fill-amber-400/10 text-amber-400/20" aria-hidden />

      <div className="relative flex items-center gap-3">
        <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-neutral-800 ring-2 ring-amber-400/50 ring-offset-2 ring-offset-neutral-950">
          {t.avatarUrl ? (
            <Image
              src={t.avatarUrl}
              alt={t.customerName}
              fill
              sizes="36px"
              unoptimized
              loading="lazy"
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-amber-300/70">
              <User className="size-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <figcaption className="truncate text-[13px] font-black tracking-wide text-white">{t.customerName}</figcaption>
          {t.location && <div className="truncate text-[10px] font-semibold tracking-widest text-amber-300/80 uppercase">{t.location}</div>}
        </div>
      </div>

      <StarRow rating={t.rating} />

      <blockquote ref={quoteRef} className="relative min-h-0 flex-1 overflow-hidden text-[13px] leading-relaxed text-white/75 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4]">
        {t.quote}
      </blockquote>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-2.5">
        {t.bookedItem ? (
          <span className="truncate rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] text-white/70">
            Booked: <span className="font-semibold text-white">{t.bookedItem}</span>
          </span>
        ) : truncated ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-bold tracking-wide text-amber-300 transition hover:text-amber-200"
          >
            … View
          </button>
        ) : (
          <span className="text-[11px] font-medium tracking-wide text-white/40">Verified customer</span>
        )}
        {isGoogle && (
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-white/60">
            <GoogleLogo className="size-3.5" /> Google
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85svh] overflow-y-auto border-white/10 bg-neutral-950 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-neutral-800 ring-2 ring-amber-400/50">
                {t.avatarUrl ? (
                  <Image src={t.avatarUrl} alt={t.customerName} fill sizes="40px" unoptimized className="object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="m-2.5 size-5 text-amber-300/70" />
                )}
              </span>
              <span>
                <span className="block text-base font-black">{t.customerName}</span>
                {t.location && <span className="block text-[11px] font-semibold tracking-widest text-amber-300/80 uppercase">{t.location}</span>}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">Full review by {t.customerName}</DialogDescription>
          </DialogHeader>
          <StarRow rating={t.rating} />
          <p className="text-sm leading-relaxed whitespace-pre-line text-white/85">{t.quote}</p>
          {isGoogle && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60">
              <GoogleLogo className="size-4" /> Posted on Google
            </span>
          )}
        </DialogContent>
      </Dialog>
    </figure>
  );
}
