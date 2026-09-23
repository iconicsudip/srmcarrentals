import Image from "next/image";
import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { resolveIcon } from "@/lib/icon-map";
import { SectionHeading } from "@/components/website/section-heading";

export function WhyChooseUsSection({ content }: { content: HomepageContent["whyChooseUs"] }) {
  if (content.items.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-white/5">
      {/* ── Full-bleed background image ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1800&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-10"
          priority={false}
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/95 via-neutral-950/80 to-neutral-950/95" />
      </div>

      {/* Orange glow — top right */}
      <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full bg-orange-500/10 blur-[120px]" aria-hidden />
      {/* Amber glow — bottom left */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-[400px] rounded-full bg-amber-500/8 blur-[100px]" aria-hidden />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading badge={content.badge} title={content.title} subtitle={content.subtitle} center />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, i) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-neutral-900/80 p-6 backdrop-blur-sm transition-all hover:border-orange-500/30 hover:bg-neutral-900"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-white/10">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex size-10 items-center justify-center rounded-lg bg-orange-500/15 text-orange-500 transition-all group-hover:bg-orange-500/25">
                    <Icon className="size-5" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-white/50">{item.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] tracking-widest text-white/30 uppercase">
                  SRM Standard <span className="size-1.5 rounded-full bg-orange-500" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

