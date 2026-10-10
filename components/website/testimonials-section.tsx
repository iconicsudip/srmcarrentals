"use client";

import Image from "next/image";
import { Quote, Star, User } from "lucide-react";

import { SectionHeading } from "@/components/website/section-heading";

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
          className={`size-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "fill-white/10 text-white/10"}`}
        />
      ))}
    </div>
  );
}

function GoogleLogo({ className }: { className?: string }) {
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

function TestimonialCard({ t }: { t: TestimonialData }) {
  const isGoogle = t.source === "google";

  return (
    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10">
      {/* Top row: avatar + name + google badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full border-2 border-orange-500/30 bg-neutral-100">
            {t.avatarUrl ? (
              <Image
                src={t.avatarUrl}
                alt={t.customerName}
                fill
                sizes="44px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-neutral-400">
                <User className="size-5" />
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-neutral-950">{t.customerName}</div>
            {t.location && (
              <div className="mt-0.5 text-[11px] font-semibold text-orange-700">{t.location}</div>
            )}
            <div className="mt-1">
              <StarRow rating={t.rating} />
            </div>
          </div>
        </div>

        {isGoogle ? (
          <GoogleLogo className="size-5 shrink-0 opacity-80" />
        ) : (
          <Quote className="size-5 shrink-0 text-orange-500/40" />
        )}
      </div>

      {/* Quote */}
      <p className="flex-1 text-sm leading-relaxed text-neutral-700 italic line-clamp-4">
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Footer */}
      {(t.bookedItem || isGoogle) && (
        <div className="border-t border-neutral-150 pt-3">
          {t.bookedItem && (
            <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-600">
              Booked: <span className="text-neutral-900 font-semibold">{t.bookedItem}</span>
            </span>
          )}
          {isGoogle && !t.bookedItem && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
              <GoogleLogo className="size-3" />
              Verified Google Review
            </span>
          )}
        </div>
      )}

      {/* Subtle warm orange aura on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

export function TestimonialsSection({
  testimonials,
  heading = {
    badge: "VERIFIED EXPERIENCES",
    title: "DRIVEN BY TRUST.",
    subtitle: "Stories from travellers who chose us for the road ahead — verified on Google.",
  },
}: {
  testimonials: TestimonialData[];
  heading?: { badge: string; title: string; subtitle?: string };
}) {
  if (testimonials.length === 0) return null;

  // Show up to 6 reviews in a 3-column grid
  const visible = testimonials.slice(0, 6);

  return (
    <section className="relative overflow-hidden border-t border-neutral-200/80 bg-[#FAFAFC]">
      {/* ── Background journey/city image ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=1600&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-5"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFC]/90 via-white/80 to-[#FAFAFC]/90" />
      </div>

      {/* ── Background decorative elements ── */}
      {/* Large blurred orange orb — top left */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 size-[600px] rounded-full bg-orange-500/10 blur-[130px]"
        aria-hidden
      />
      {/* Amber orb — bottom right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 size-[500px] rounded-full bg-amber-400/8 blur-[110px]"
        aria-hidden
      />
      {/* Subtle dot-grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.8) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />
      {/* Giant decorative quote mark */}
      <div
        className="pointer-events-none absolute right-8 top-0 select-none text-[280px] font-black leading-none text-neutral-950/[0.03]"
        aria-hidden
      >
        &ldquo;
      </div>

      {/* ── Content ── */}
      <div className="relative mx-auto max-w-[1520px] px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          badge={heading.badge}
          title={heading.title}
          subtitle={heading.subtitle}
          center
        />

        {/* Rating summary pill */}
        <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full border border-orange-500/30 bg-orange-50/80 px-5 py-2.5 shadow-xs">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-sm font-bold text-neutral-950">
            4.9{" "}
            <span className="font-normal text-neutral-600">
              · {testimonials.length} review{testimonials.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-neutral-300 pl-3">
            <GoogleLogo className="size-4" />
            <span className="text-xs text-neutral-600 font-medium">Google</span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>

        {testimonials.length > 6 && (
          <p className="mt-6 text-center text-xs text-neutral-400 font-medium">
            Showing 6 of {testimonials.length} reviews
          </p>
        )}
      </div>
    </section>
  );
}
