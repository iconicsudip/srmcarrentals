import Image from "next/image";
import Link from "next/link";
import { Award } from "lucide-react";

import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { stripTrailingPunctuation } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function PhilosophySection({ content }: { content: HomepageContent["philosophy"] }) {
  return (
    <section className="mx-auto max-w-[1520px] px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-neutral-200/90 bg-neutral-100 shadow-lg">
          <Image
            src={content.imageUrl || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=80&auto=format&fit=crop"}
            alt="SRM Car Rentals premium fleet"
            fill
            sizes="(max-width: 1024px) 100vw, 600px"
            className="object-cover"
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white/90 px-4 py-3 backdrop-blur-md shadow-lg">
            <div>
              <div className="text-[10px] font-bold tracking-widest text-orange-700 uppercase">Heritage &amp; Craftsmanship</div>
              <div className="mt-0.5 text-xs font-black text-neutral-950">JODHPUR · JAIPUR · UDAIPUR</div>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600 shadow-xs">
              <Award className="size-4" />
            </span>
          </div>
        </div>

        <div>
          {content.badge && (
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-[11px] font-bold tracking-widest text-orange-700 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
              {content.badge}
            </span>
          )}
          <h2 className="text-3xl leading-tight font-black tracking-tight text-neutral-950 uppercase sm:text-4xl">
            {stripTrailingPunctuation(content.title)}
            <span className="text-orange-500">.</span>
          </h2>
          {content.paragraph1 && <p className="mt-5 text-neutral-600 leading-relaxed">{content.paragraph1}</p>}
          {content.paragraph2 && <p className="mt-4 text-neutral-600 leading-relaxed">{content.paragraph2}</p>}

          {content.stats.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-neutral-200 pt-6 sm:grid-cols-4">
              {content.stats.map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl font-black text-neutral-950">{stat.value}</div>
                  <div className="text-xs text-neutral-500 font-medium mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          <Button asChild size="lg" className="mt-8 bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/25 hover:bg-orange-600 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all">
            <Link href="/cars">Explore The Fleet</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
