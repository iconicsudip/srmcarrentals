import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";

import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { resolveIcon } from "@/lib/icon-map";
import { stripTrailingPunctuation } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function B2bSection({ content, phone }: { content: HomepageContent["b2b"]; phone: string }) {
  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-neutral-950">
      {/* ── Background corporate fleet image ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1600&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-neutral-950/50" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          {/* ── Left: text content ── */}
          <div>
            {content.badge && (
              <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-orange-500">
                {content.badge}
              </span>
            )}
            <h2 className="mt-4 max-w-2xl text-3xl leading-tight font-black text-white uppercase sm:text-5xl">
              {stripTrailingPunctuation(content.title)}
              <span className="text-orange-500">.</span>
            </h2>
            {content.subtitle && <p className="mt-4 max-w-xl text-white/50">{content.subtitle}</p>}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-orange-500 font-bold text-white hover:bg-orange-600">
                <Link href={content.ctaHref}>
                  {content.ctaLabel} <ArrowRight className="size-4" />
                </Link>
              </Button>
              {phone && (
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <a href={`tel:${phone.replace(/\s/g, "")}`}>
                    <Phone className="size-4" /> Talk to Our Team
                  </a>
                </Button>
              )}
            </div>

            {content.items.length > 0 && (
              <div className="mt-10 grid grid-cols-1 gap-4 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                {content.items.map((item, i) => {
                  const Icon = resolveIcon(item.icon);
                  return (
                    <div key={i} className="rounded-xl border border-white/10 bg-neutral-900 p-5">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500">
                        <Icon className="size-4" />
                      </span>
                      <h3 className="mt-3 text-sm font-bold text-white">{item.title}</h3>
                      <p className="mt-1 text-xs text-white/50">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: decorative image panel ── */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=900&q=80&auto=format&fit=crop"
                alt="Premium corporate fleet for business travel"
                fill
                sizes="45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Floating stat badge */}
              <div className="absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-xl border border-white/10 bg-black/70 px-5 py-4 backdrop-blur">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">500+</div>
                  <div className="text-[11px] text-white/50">Corporate Clients</div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-white">24/7</div>
                  <div className="text-[11px] text-white/50">Fleet Support</div>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-orange-500">B2B</div>
                  <div className="text-[11px] text-white/50">Preferred Rates</div>
                </div>
              </div>
            </div>

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-orange-500/5 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
