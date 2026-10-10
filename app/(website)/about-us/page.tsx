import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, Car, MapPin, Phone, Shield, Target, Users } from "lucide-react";
import { getAboutPageContent } from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "About SRM Car Rentals | Self-Drive & Chauffeur Cars in Rajasthan",
    description:
      "SRM Car Rentals offers trusted self-drive car rental services across Rajasthan with premium cars available in Udaipur, Jaipur and Navsari. Affordable, flexible, customer-first.",
    alternates: { canonical: "/about-us" },
  };
  const resolved = await getDynamicSeoForPath("/about-us", fallback);
  return resolved.metadata;
}

export default async function AboutUsPage() {
  const content = await getAboutPageContent();
  const { hero, stats, story, features, branches } = content;

  const FEATURE_ICONS = [Shield, Car, Users, Award];

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      <DynamicJsonLd path="/about-us" />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1800&q=70&auto=format&fit=crop"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.06]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-[#FAFAFC]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center sm:px-6 lg:px-8">
          {hero.badge && (
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-600 uppercase">
              {hero.badge}
            </span>
          )}
          <h1 className="mt-6 text-5xl font-black tracking-tight text-neutral-950 sm:text-7xl">
            {hero.title}
            <span className="text-orange-500">.</span>
          </h1>
          {hero.subtitle && (
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-neutral-600">
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── Stats strip ── */}
      {stats && stats.length > 0 && (
        <section className="border-y border-neutral-200/80 bg-white/90 shadow-sm backdrop-blur">
          <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 divide-x divide-neutral-200 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="px-8 py-10 text-center">
                  <div className="text-4xl font-black text-orange-600">{stat.value}</div>
                  <div className="mt-1.5 text-xs font-semibold tracking-widest text-neutral-500 uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Story ── */}
      <section className="relative overflow-hidden py-24">
        <div className="relative mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Story */}
            <div className="flex flex-col justify-center">
              <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">Our Story</span>
              <h2 className="mt-4 text-4xl font-black text-neutral-950">{story.title || "Driven by passion."}</h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-600">
                <p>{story.paragraph1}</p>
                {story.paragraph2 && <p>{story.paragraph2}</p>}
              </div>
            </div>

            {/* Vision */}
            <div className="flex flex-col gap-6">
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-orange-500/10">
                  <Target className="size-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-950">Our Mission</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  To provide seamless self-drive freedom across India with immaculate cars, transparent pricing, and uncompromising customer support at every touchpoint.
                </p>
              </div>
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8 shadow-sm">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-orange-500/20">
                  <Award className="size-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-neutral-950">Our Commitment</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  Spotless interiors. Timely handovers. Honest tariffs. Every single rental.
                </p>
                <div className="mt-8 border-t border-neutral-200/80 pt-6 flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Ready to experience it?</span>
                  <Link
                    href="/cars"
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
                  >
                    View Fleet <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features / Why SRM ── */}
      {features && features.length > 0 && (
        <section className="border-t border-neutral-200/60 bg-white/70 py-24">
          <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">The SRM Advantage</span>
              <h2 className="mt-4 text-4xl font-black text-neutral-950">Why drive with SRM?</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length]!;
                return (
                  <div
                    key={f.title}
                    className="group rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm transition hover:border-orange-500/40 hover:shadow-md"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 transition group-hover:bg-orange-500/20">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mt-5 font-bold text-neutral-950">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-600">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Branch Offices ── */}
      {branches && branches.length > 0 && (
        <section className="border-t border-neutral-200/60 py-24">
          <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <span className="text-xs font-bold tracking-widest text-orange-600 uppercase">Our Locations</span>
              <h2 className="mt-4 text-4xl font-black text-neutral-950">Branch offices.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-neutral-600">
                Pick up at our branch or request doorstep delivery to your hotel, airport, or railway station.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {branches.map((b) => (
                <div
                  key={b.city}
                  className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm transition hover:border-orange-500/40 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="size-4 shrink-0 text-orange-500" />
                      <h3 className="text-lg font-bold text-neutral-950">{b.city}</h3>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">{b.address}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
                      <Phone className="size-3.5 shrink-0 text-orange-500" />
                      <a
                        href={`tel:${b.phone.replace(/\s+/g, "")}`}
                        className="transition hover:text-orange-600"
                      >
                        {b.phone}
                      </a>
                    </div>
                  </div>
                  {b.mapUrl && (
                    <div className="mt-6 border-t border-neutral-200/80 pt-5">
                      <a
                        href={b.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-orange-600 transition hover:text-orange-700"
                      >
                        View on Google Maps &rarr;
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
