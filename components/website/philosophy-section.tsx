import Image from "next/image";
import { Award } from "lucide-react";

import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { stripTrailingPunctuation } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PhilosophySection({ content }: { content: HomepageContent["philosophy"] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900">
          <Image
            src={content.imageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80&auto=format&fit=crop"}
            alt="SRM Car Rentals premium fleet"
            fill
            sizes="(max-width: 1024px) 100vw, 600px"
            className="object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur">
            <div>
              <div className="text-[10px] font-semibold tracking-widest text-orange-500 uppercase">Heritage &amp; Craftsmanship</div>
              <div className="mt-0.5 text-xs font-bold text-white">JODHPUR · JAIPUR · UDAIPUR</div>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-500">
              <Award className="size-4" />
            </span>
          </div>
        </div>

        <div>
          {content.badge && (
            <span className="mb-4 inline-flex rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-orange-500">
              {content.badge}
            </span>
          )}
          <h2 className="text-3xl leading-tight font-black tracking-tight text-white uppercase sm:text-4xl">
            {stripTrailingPunctuation(content.title)}
            <span className="text-orange-500">.</span>
          </h2>
          {content.paragraph1 && <p className="mt-5 text-white/60">{content.paragraph1}</p>}
          {content.paragraph2 && <p className="mt-4 text-white/60">{content.paragraph2}</p>}

          {content.stats.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 sm:grid-cols-4">
              {content.stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-xs text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          <Button asChild size="lg" className="mt-8 bg-orange-500 font-bold text-white hover:bg-orange-600">
            <a href="/cars">Explore The Fleet</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
