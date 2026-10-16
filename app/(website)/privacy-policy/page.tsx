import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getCompanyContent, getPrivacyPageContent } from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";
import { RichText } from "@/components/website/rich-text";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Privacy Policy | SRM Car Rentals",
    description: "How SRM Car Rentals collects, uses and protects your personal information when you book a car, taxi or tour.",
    alternates: { canonical: "/privacy-policy" },
  };
  const resolved = await getDynamicSeoForPath("/privacy-policy", fallback);
  return resolved.metadata;
}

export default async function PrivacyPolicyPage() {
  const [content, company] = await Promise.all([getPrivacyPageContent(), getCompanyContent()]);
  const { hero, lastUpdated, intro, sections, contact } = content;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      <DynamicJsonLd path="/privacy-policy" />

      <section className="relative overflow-hidden border-b border-neutral-200/70 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          {hero.badge && (
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-600 uppercase">
              {hero.badge}
            </span>
          )}
          <h1 className="mt-6 text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl">
            {hero.title}
            <span className="text-orange-500">.</span>
          </h1>
          {hero.subtitle && <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600">{hero.subtitle}</p>}
          {lastUpdated && <p className="mt-5 text-xs font-semibold tracking-widest text-neutral-400 uppercase">Last updated: {lastUpdated}</p>}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          {sections.length > 0 && (
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <p className="mb-3 text-xs font-bold tracking-widest text-orange-600 uppercase">On this page</p>
              <nav className="flex flex-col gap-1 border-l border-neutral-200">
                {sections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`} className="-ml-px border-l-2 border-transparent py-1.5 pl-4 text-sm text-neutral-600 transition hover:border-orange-500 hover:text-orange-600">
                    <span className="mr-2 font-mono text-xs text-neutral-400">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                ))}
              </nav>
            </aside>
          )}

          <div className="min-w-0 space-y-6">
            {intro && (
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
                <RichText value={intro} className="text-neutral-600" />
              </div>
            )}

            {sections.map((s, i) => (
              <article key={s.id} id={s.id} className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm">
                <div className="flex items-center gap-4 border-b border-neutral-200/80 pb-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 font-mono text-sm font-bold text-orange-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-xl font-bold text-neutral-950">{s.title}</h2>
                </div>
                <RichText value={s.body} className="mt-6 text-neutral-600" />
              </article>
            ))}

            {contact.show && (
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-neutral-950">{contact.title}</h3>
                {contact.text && <p className="mt-2 text-sm text-neutral-600">{contact.text}</p>}
                <ul className="mt-5 space-y-2.5 text-sm text-neutral-700">
                  {company.email && (
                    <li className="flex items-center gap-3">
                      <Mail className="size-4 text-orange-500" />
                      <a href={`mailto:${company.email}`} className="hover:text-orange-600">{company.email}</a>
                    </li>
                  )}
                  {company.phone && (
                    <li className="flex items-center gap-3">
                      <Phone className="size-4 text-orange-500" />
                      <a href={`tel:${company.phone.replace(/\s/g, "")}`} className="hover:text-orange-600">{company.phone}</a>
                    </li>
                  )}
                  {company.address && (
                    <li className="flex items-start gap-3">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-orange-500" />
                      <span>{company.address}</span>
                    </li>
                  )}
                </ul>
                {contact.buttonLabel && (
                  <Link href={contact.buttonHref || "/contact-us"} className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600">
                    {contact.buttonLabel}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
