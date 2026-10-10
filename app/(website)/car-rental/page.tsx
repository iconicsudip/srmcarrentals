import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  Phone,
  Plane,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { ChauffeurSection } from "@/components/website/chauffeur-section";
import { ChauffeurFilterSidebar } from "@/components/website/chauffeur-filter-sidebar";
import {
  listActiveChauffeurServices,
  getCompanyContent,
} from "@/modules/website/public-content.service";
import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const fallback: Metadata = {
    title: "Chauffeur Driven Taxi & Luxury Car Rental Services | SRM Car Rentals",
    description:
      "Executive chauffeur-driven taxis, airport transfers, luxury sedans, and SUVs with transparent per-trip and per-km pricing across Rajasthan.",
    alternates: { canonical: "/car-rental" },
  };
  const resolved = await getDynamicSeoForPath("/car-rental", fallback);
  return resolved.metadata;
}

interface CarRentalPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function CarRentalPage({ searchParams }: CarRentalPageProps) {
  const [params, services, company] = await Promise.all([
    searchParams,
    listActiveChauffeurServices(),
    getCompanyContent(),
  ]);

  // Derive unique categories from all services
  const categories = Array.from(
    new Map(services.map((s) => [s.category, { name: s.category }])).values(),
  );

  const selectedCategory = params.category;
  const filteredServices =
    selectedCategory && selectedCategory !== "all"
      ? services.filter(
          (s) => s.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim(),
        )
      : services;

  const whatsappNumber = (company.socialLinks?.whatsapp || company.phone || "919414551250").replace(/[^0-9]/g, "");

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900 pb-24">
      <DynamicJsonLd path="/car-rental" />

      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-neutral-200/80 bg-white/80 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1520px] items-center gap-1.5 px-4 text-xs text-neutral-500 sm:px-8 lg:px-12">
          <Link href="/" className="hover:text-neutral-900 transition">
            Home
          </Link>
          <ChevronRight className="size-3 text-neutral-400" />
          <span className="font-semibold text-orange-600">Chauffeur Fleet &amp; Transfers</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:py-10 sm:px-8 lg:px-12">
        {/* Luxury Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-neutral-200/90 bg-gradient-to-br from-white via-neutral-50/80 to-orange-50/40 p-6 sm:p-10 shadow-xl mb-10">
          <div className="absolute -right-20 -top-20 size-80 rounded-full bg-gradient-to-bl from-orange-400/15 to-transparent blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-orange-600 border border-orange-500/20">
                <Sparkles className="size-3 text-orange-500" />
                Executive Chauffeur &amp; Private Transfers
              </span>
              <h1 className="mt-3.5 text-3xl font-black uppercase tracking-tight text-neutral-950 sm:text-4xl md:text-5xl">
                Arrive In Distinction<span className="text-orange-500">.</span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-neutral-600 leading-relaxed">
                Handcrafted journeys with uniformed master chauffeurs, immaculate climate-controlled fleet, complimentary chilled mineral water, and transparent fixed tariffs with zero surprise surcharges.
              </p>

              {/* 4 Executive Highlights Bar */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2 border-t border-neutral-200/70 text-xs">
                <div className="flex items-center gap-2 font-bold text-neutral-800">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span>Police-Verified Chauffeurs</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-neutral-800">
                  <Plane className="size-4 text-orange-500 shrink-0" />
                  <span>Airport Gate Meet &amp; Greet</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-neutral-800">
                  <Award className="size-4 text-amber-500 shrink-0" />
                  <span>100% Sanitized Interiors</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-neutral-800">
                  <Clock className="size-4 text-orange-500 shrink-0" />
                  <span>Zero Toll &amp; Tax Surprises</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & WhatsApp Pill */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  "Hello SRM Car Rentals! 👋 I would like to inquire about booking a chauffeur-driven luxury vehicle.",
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-6 py-4 text-xs font-black uppercase tracking-wider text-white shadow-xl shadow-emerald-600/25 transition active:scale-95 text-center"
              >
                <MessageSquare className="size-4" />
                <span>Instant WhatsApp Dispatch</span>
              </a>
              <a
                href={`tel:${company.phone?.replace(/\s/g, "") || "+919414551250"}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white hover:bg-neutral-50 px-6 py-3.5 text-xs font-bold text-neutral-800 shadow-sm transition text-center"
              >
                <Phone className="size-4 text-orange-500" />
                <span>Call Concierge: {company.phone || "+91 9414551250"}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Catalog Main Layout */}
        {services.length === 0 ? (
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-16 text-center shadow-lg">
            <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950">Chauffeur Fleet Updating</h2>
            <p className="mt-3 text-sm text-neutral-600 max-w-md mx-auto">
              Our executive transfer fleet is being serviced and refreshed. Please connect with our concierge directly via phone or WhatsApp.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* LEFT: Luxurious Sticky Filter Sidebar */}
            <div className="w-full lg:w-[290px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
              <Suspense fallback={null}>
                <ChauffeurFilterSidebar
                  categories={categories.map((c) => c.name)}
                  total={filteredServices.length}
                />
              </Suspense>
            </div>

            {/* RIGHT: Expansive Chauffeur Fleet Grid */}
            <div className="flex-1 min-w-0">
              {filteredServices.length === 0 ? (
                <div className="rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
                  <h3 className="text-xl font-bold text-neutral-950 uppercase">No services in this category</h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Try switching back to all categories or explore our full fleet.
                  </p>
                  <Button asChild className="mt-6 rounded-xl bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white">
                    <Link href="/car-rental">View All Services →</Link>
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tight text-neutral-950">
                        {selectedCategory ? `${selectedCategory} Collection` : "Available Fleet &amp; Tariffs"}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Showing {filteredServices.length} verified chauffeur {filteredServices.length === 1 ? "option" : "options"}
                      </p>
                    </div>
                  </div>

                  <ChauffeurSection
                    services={filteredServices}
                    phone={company.phone}
                    hideHeading={true}
                    columnsClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
