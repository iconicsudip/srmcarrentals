import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { GoogleLogo, TestimonialCard, type TestimonialData } from "@/components/website/testimonial-card";
import { prisma } from "@/lib/prisma";
import { getDynamicSeoForPath } from "@/lib/seo/dynamic-seo";

export const revalidate = 300;

const PAGE_SIZE = 24;
const ORDER = [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }, { id: "asc" as const }];

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Customer Reviews | SRM Car Rentals",
    description: "Read genuine Google reviews from customers who rented self-drive cars with SRM Car Rentals in Udaipur, Jaipur and Navsari.",
    alternates: { canonical: "/reviews" },
  };
  const resolved = await getDynamicSeoForPath("/reviews", fallback);
  return resolved.metadata;
}

const href = (page: number, rating?: number) => {
  const q = new URLSearchParams();
  if (rating) q.set("rating", String(rating));
  if (page > 1) q.set("page", String(page));
  const s = q.toString();
  return `/reviews${s ? `?${s}` : ""}`;
};

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const rating = [1, 2, 3, 4, 5].includes(Number(params.rating)) ? Number(params.rating) : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const where = { status: "ACTIVE" as const, ...(rating ? { rating } : {}) };

  const [rows, filteredTotal, overall, byRating] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: ORDER,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, customerName: true, location: true, avatarUrl: true, rating: true, quote: true, bookedItem: true, source: true },
    }),
    prisma.testimonial.count({ where }),
    prisma.testimonial.aggregate({ where: { status: "ACTIVE" }, _avg: { rating: true }, _count: true }),
    prisma.testimonial.groupBy({ by: ["rating"], where: { status: "ACTIVE" }, _count: true }),
  ]);

  const total = overall._count;
  const average = overall._avg.rating ?? 0;
  const counts = new Map(byRating.map((r) => [r.rating, r._count]));
  const pages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));

  const jsonLd =
    total > 0
      ? {
          "@context": "https://schema.org",
          "@type": "AutoRental",
          name: "SRM Car Rentals",
          aggregateRating: { "@type": "AggregateRating", ratingValue: average.toFixed(1), reviewCount: total, bestRating: 5 },
        }
      : null;

  return (
    <div className="relative overflow-hidden bg-neutral-950 text-white">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[64rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.22),transparent_65%)]" aria-hidden />

      <div className="relative mx-auto max-w-[1520px] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <nav className="text-xs text-white/50" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white">Home</Link> <span className="mx-1.5">/</span> <span className="text-white/80">Reviews</span>
        </nav>

        <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <h1 className="text-4xl leading-[1.02] font-black tracking-tight uppercase sm:text-6xl">
              What our customers say<span className="text-orange-500">.</span>
            </h1>
            <span className="lux-rule mt-4 block" />
            <p className="mt-4 max-w-xl text-white/65">Every review below is a real rating from a customer who drove with us — read them all, or filter by stars.</p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-6 backdrop-blur-md sm:p-7">
            <div className="flex items-center gap-6">
              <div>
                <div className="bg-gradient-to-br from-amber-200 via-amber-300 to-orange-400 bg-clip-text text-6xl leading-none font-black tracking-tighter text-transparent">{average.toFixed(1)}</div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`size-5 ${i < Math.round(average) ? "fill-amber-400 text-amber-400" : "fill-white/15 text-white/15"}`} />
                  ))}
                </div>
              </div>
              <div className="border-l border-white/10 pl-6">
                <div className="text-3xl font-black">{total.toLocaleString("en-IN")}</div>
                <div className="text-xs font-semibold tracking-widest text-white/55 uppercase">reviews</div>
                <div className="mt-2 flex items-center gap-2 text-xs text-white/70">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-white"><GoogleLogo className="size-3.5" /></span> Google
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* star filters */}
        <div className="mt-10 flex flex-wrap gap-2">
          <Link href={href(1)} className={`rounded-full px-4 py-2 text-xs font-bold tracking-wide transition ${!rating ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30" : "border border-white/15 bg-white/5 text-white/70 hover:border-amber-400/50 hover:text-white"}`}>
            All ({total})
          </Link>
          {[5, 4, 3, 2, 1].map((r) =>
            counts.get(r) ? (
              <Link key={r} href={href(1, r)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold tracking-wide transition ${rating === r ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30" : "border border-white/15 bg-white/5 text-white/70 hover:border-amber-400/50 hover:text-white"}`}>
                {r} <Star className="size-3 fill-amber-400 text-amber-400" /> ({counts.get(r)})
              </Link>
            ) : null,
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map((t) => (
            <div key={t.id} className="h-[238px]">
              <TestimonialCard t={t as TestimonialData} />
            </div>
          ))}
        </div>
        {rows.length === 0 && <p className="py-20 text-center text-white/60">No reviews match this filter.</p>}

        {pages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Pagination">
            {page > 1 ? (
              <Link href={href(page - 1, rating)} rel="prev" className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold hover:border-amber-400/60">
                <ChevronLeft className="size-4" /> Previous
              </Link>
            ) : null}
            <span className="text-sm text-white/60">Page {page} of {pages}</span>
            {page < pages ? (
              <Link href={href(page + 1, rating)} rel="next" className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold hover:border-amber-400/60">
                Next <ChevronRight className="size-4" />
              </Link>
            ) : null}
          </nav>
        )}
      </div>
    </div>
  );
}
