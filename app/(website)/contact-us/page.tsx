import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { getContactPageContent } from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Contact SRM Car Rentals | Udaipur, Jaipur, Navsari",
    description:
      "Contact SRM Car Rentals for self-drive bookings in Udaipur, Jaipur, and Navsari. Call or WhatsApp us for instant support.",
    alternates: { canonical: "/contact-us" },
  };
  const resolved = await getDynamicSeoForPath("/contact-us", fallback);
  return resolved.metadata;
}

const METHOD_ICONS: Record<string, React.ElementType> = {
  phone: Phone,
  whatsapp: MessageSquare,
  email: Mail,
  default: Phone,
};

export default async function ContactUsPage() {
  const content = await getContactPageContent();
  const { hero, emergencyNotice, contactMethods, branches } = content;

  return (
    <div className="min-h-screen bg-neutral-950">
      <DynamicJsonLd path="/contact-us" />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1800&q=70&auto=format&fit=crop"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-neutral-950" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-32 text-center sm:px-6 lg:px-8">
          {hero.badge && (
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-400 uppercase">
              {hero.badge}
            </span>
          )}
          <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-7xl">
            {hero.title}
            <span className="text-orange-500">.</span>
          </h1>
          {hero.subtitle && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/55">
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── Emergency hotline ── */}
      {emergencyNotice && (
        <section className="border-y border-orange-500/20 bg-orange-500/5 py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3 text-sm text-orange-300">
              <Phone className="size-4 shrink-0 text-orange-400" />
              <span>{emergencyNotice}</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Contact method cards ── */}
      {contactMethods && contactMethods.length > 0 && (
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">Reach Us</span>
              <h2 className="mt-4 text-4xl font-black text-white">Get in touch.</h2>
              <p className="mt-4 text-white/50">We respond within minutes during operating hours.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {contactMethods.map((m) => {
                const key = (m.label?.toLowerCase() ?? "default") as string;
                const Icon = METHOD_ICONS[key] ?? METHOD_ICONS.default!;
                return (
                  <a
                    key={m.label}
                    href={m.href}
                    className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-8 transition-all hover:border-orange-500/40 hover:bg-neutral-800/80"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/15 text-orange-500 transition group-hover:bg-orange-500/25">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="font-bold text-white transition group-hover:text-orange-400">
                        {m.label}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-white/80">{m.value}</div>
                      {m.description && (
                        <div className="mt-1 text-xs text-white/40">{m.description}</div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Branch locations ── */}
      {branches && branches.length > 0 && (
        <section className="relative overflow-hidden border-t border-white/5 py-24">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <Image
              src="https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=1400&q=60&auto=format&fit=crop"
              alt=""
              fill
              sizes="100vw"
              className="object-cover opacity-5"
            />
            <div className="absolute inset-0 bg-neutral-950/90" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <span className="text-xs font-bold tracking-widest text-orange-400 uppercase">Our Showrooms</span>
              <h2 className="mt-4 text-4xl font-black text-white">Branch locations.</h2>
              <p className="mt-4 text-white/50">Self-drive handover centres across Rajasthan and Gujarat.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {branches.map((b) => (
                <div
                  key={b.city}
                  className={`flex flex-col justify-between rounded-2xl border p-8 ${b.isHQ
                    ? "border-orange-500/30 bg-orange-500/5 shadow-lg shadow-orange-950/30"
                    : "border-white/10 bg-neutral-900"
                    }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <MapPin className="size-4 shrink-0 text-orange-400" />
                        <h3 className="text-xl font-bold text-white">{b.city}</h3>
                      </div>
                      {b.isHQ && (
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-orange-400 uppercase">
                          Headquarters
                        </span>
                      )}
                    </div>
                    {b.state && (
                      <p className="mt-1 text-xs text-white/35">{b.state}</p>
                    )}

                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase">Address</div>
                        <p className="mt-1 text-sm leading-relaxed text-white/70">{b.address}</p>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold tracking-widest text-white/35 uppercase">Phone</div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <a
                            href={`tel:${b.phone.replace(/\s+/g, "")}`}
                            className="flex items-center gap-1.5 text-sm font-medium text-white/70 transition hover:text-orange-400"
                          >
                            <Phone className="size-3 text-orange-400" /> {b.phone}
                          </a>
                          {b.phone2 && (
                            <a
                              href={`tel:${b.phone2.replace(/\s+/g, "")}`}
                              className="flex items-center gap-1.5 text-sm text-white/55 transition hover:text-orange-400"
                            >
                              <Phone className="size-3 text-orange-400" /> {b.phone2}
                            </a>
                          )}
                        </div>
                      </div>
                      {b.hours && (
                        <div className="flex items-center gap-2 border-t border-white/8 pt-3 text-xs text-white/45">
                          <Clock className="size-3.5 shrink-0 text-orange-400" />
                          {b.hours}
                        </div>
                      )}
                    </div>
                  </div>

                  {b.mapUrl && (
                    <div className="mt-6 border-t border-white/10 pt-5">
                      <a
                        href={b.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-orange-400 transition hover:text-orange-300"
                      >
                        Directions on Google Maps →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Map embed */}
            {branches.some((b) => b.isHQ && b.mapEmbed) && (
              <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 shadow-xl">
                <div className="flex items-center gap-2 border-b border-white/10 bg-neutral-900 px-6 py-4 text-sm font-semibold text-white">
                  <MapPin className="size-4 text-orange-400" /> Headquarters — Udaipur
                </div>
                <iframe
                  title="SRM Car Rentals Udaipur HQ"
                  src={branches.find((b) => b.isHQ && b.mapEmbed)?.mapEmbed}
                  className="h-80 w-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
