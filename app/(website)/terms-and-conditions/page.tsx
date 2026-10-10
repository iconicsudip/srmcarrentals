import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, FileText, MessageSquare, Scale } from "lucide-react";
import { getTermsPageContent } from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Terms & Conditions | SRM Car Rentals",
    description:
      "Read the complete terms and conditions for self-drive car rentals at SRM Car Rentals. Cancellation policy, fuel policy, speed limits and more.",
    alternates: { canonical: "/terms-and-conditions" },
  };
  const resolved = await getDynamicSeoForPath("/terms-and-conditions", fallback);
  return resolved.metadata;
}

const SECTION_ICONS = [Scale, FileText, AlertCircle, MessageSquare, Scale, FileText, AlertCircle, MessageSquare];

export default async function TermsAndConditionsPage() {
  const content = await getTermsPageContent();
  const { hero, importantNotice, sections, cancellationTable } = content;

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      <DynamicJsonLd path="/terms-and-conditions" />
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <Image
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1800&q=70&auto=format&fit=crop"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-[0.05]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-[#FAFAFC]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 lg:px-8">
          {hero.badge && (
            <span className="inline-block rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-600 uppercase">
              {hero.badge}
            </span>
          )}
          <h1 className="mt-6 text-5xl font-black tracking-tight text-neutral-950 sm:text-6xl">
            {hero.title}
            <span className="text-orange-500">.</span>
          </h1>
          {hero.subtitle && (
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-neutral-600">
              {hero.subtitle}
            </p>
          )}
        </div>
      </section>

      {/* ── Important notice ── */}
      {importantNotice && (
        <section className="border-y border-orange-500/20 bg-orange-50/50 py-5">
          <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
            <div className="flex items-start gap-3 text-sm leading-relaxed text-neutral-800">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-orange-600" />
              <div>
                <strong className="font-semibold text-orange-600">Notice & Acceptance: </strong>
                {importantNotice}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Policy sections ── */}
      <section className="py-20">
        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {sections &&
              sections.map((section, idx) => {
                const Icon = SECTION_ICONS[idx % SECTION_ICONS.length]!;
                return (
                  <div
                    key={section.id}
                    id={section.id}
                    className="rounded-2xl border border-neutral-200/90 bg-white p-8 shadow-sm transition hover:border-orange-500/40 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 border-b border-neutral-200/80 pb-5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <span className="text-xs font-mono text-orange-600 font-semibold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <h2 className="text-lg font-bold text-neutral-950">{section.title}</h2>
                      </div>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {section.points.map((point, pIdx) => (
                        <li
                          key={pIdx}
                          className="flex items-start gap-3 text-sm leading-relaxed text-neutral-600"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-500" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>

          {/* ── Cancellation table ── */}
          {cancellationTable && cancellationTable.length > 0 && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-8 py-5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-neutral-950">Cancellation & Refund Charges</h2>
                  <p className="text-xs text-neutral-500">Deductions based on time before scheduled pickup</p>
                </div>
              </div>
              <div className="overflow-x-auto px-8 py-6">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                      <th className="pb-4">Cancellation Notice Window</th>
                      <th className="pb-4 text-right">Deduction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {cancellationTable.map((row, i) => (
                      <tr key={i} className="transition hover:bg-neutral-50/50">
                        <td className="py-3.5 font-medium text-neutral-800">{row.notice}</td>
                        <td className="py-3.5 text-right font-bold text-orange-600">{row.charge}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Help CTA ── */}
          <div className="mt-10 rounded-2xl border border-neutral-200/90 bg-white p-10 text-center shadow-sm">
            <h3 className="text-xl font-bold text-neutral-950">Need clarification on any policy?</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm text-neutral-600">
              Our reservation team is available every day to answer your questions before you book.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/contact-us"
                className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition hover:bg-orange-600"
              >
                Contact Support
              </Link>
              <Link
                href="/cars"
                className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-orange-500 hover:text-orange-600 hover:bg-orange-500/5"
              >
                Browse Fleet
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
