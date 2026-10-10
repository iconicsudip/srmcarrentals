import Image from "next/image";
import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { resolveIcon } from "@/lib/icon-map";
import { SectionHeading } from "@/components/website/section-heading";

export function WhyChooseUsSection({ content }: { content: HomepageContent["whyChooseUs"] }) {
  if (content.items.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-neutral-200/80 bg-[#FAFAFC]">
      {/* ── Full-bleed background image ── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1800&q=70&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-5"
          priority={false}
        />
        {/* Soft light luxury gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFC]/90 via-white/80 to-[#FAFAFC]/90" />
      </div>

      {/* Warm Orange glow — top right */}
      <div className="pointer-events-none absolute -right-32 -top-32 size-[500px] rounded-full bg-orange-500/10 blur-[140px]" aria-hidden />
      {/* Amber glow — bottom left */}
      <div className="pointer-events-none absolute -bottom-32 -left-32 size-[400px] rounded-full bg-amber-500/8 blur-[120px]" aria-hidden />

      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.8) 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1520px] px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading badge={content.badge} title={content.title} subtitle={content.subtitle} center />

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.items.map((item, i) => {
            const Icon = resolveIcon(item.icon);
            return (
              <div
                key={i}
                className="group rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-neutral-200 group-hover:text-orange-500/30 transition-colors">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 transition-all group-hover:bg-orange-500 group-hover:text-white shadow-xs">
                    <Icon className="size-5" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-neutral-950">{item.title}</h3>
                <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{item.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3 text-[11px] tracking-widest text-neutral-400 uppercase font-semibold">
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

