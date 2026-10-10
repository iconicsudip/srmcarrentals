import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Mail, MapPin, MessageSquare, Phone, ShieldCheck, Star, TentTree } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCompanyContent, getPublicTourBySlug } from "@/modules/website/public-content.service";

interface TourDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TourDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = await getPublicTourBySlug(slug);
  if (!tour) return {};

  return {
    title: `${tour.name} — ${tour.durationDays} Day Tour`,
    description: tour.description ?? `A ${tour.durationDays}-day curated tour experience.`,
    alternates: { canonical: `/tours/${tour.slug}` },
    openGraph: { title: tour.name, description: tour.description ?? undefined, images: tour.imageUrl ? [tour.imageUrl] : undefined },
  };
}

export default async function TourDetailPage({ params }: TourDetailPageProps) {
  const { slug } = await params;
  const [tour, company] = await Promise.all([getPublicTourBySlug(slug), getCompanyContent()]);

  if (!tour) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-6 text-xs text-neutral-500 font-medium">
        <Link href="/tours" className="hover:text-orange-600 transition">
          All Tours
        </Link>{" "}
        / <span className="text-neutral-900 font-semibold">{tour.name}</span>
      </nav>

      <div className="relative aspect-video overflow-hidden rounded-3xl border border-neutral-200/90 bg-neutral-100 shadow-xl">
        {tour.imageUrl ? (
          <Image src={tour.imageUrl} alt={tour.name} fill sizes="900px" className="object-cover" priority />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-400">
            <TentTree className="size-20" />
          </div>
        )}
        <Badge className="absolute top-4 left-4 flex items-center gap-1 border-white/40 bg-white/90 text-neutral-900 backdrop-blur-md shadow-md">
          <MapPin className="size-3 text-orange-600" /> {tour.category.name}
        </Badge>
        <Badge className="absolute top-4 right-4 flex items-center gap-1 border-white/40 bg-white/90 text-neutral-900 backdrop-blur-md shadow-md">
          <Star className="fill-amber-500 text-amber-500 size-3" /> {Number(tour.rating).toFixed(1)}
        </Badge>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <span className="flex items-center gap-1.5 text-sm text-neutral-500 font-medium">
              <Clock className="size-4 text-orange-600" /> {tour.durationDays} Days · {tour.durationNights} Nights
            </span>
            <h1 className="mt-2 text-3xl font-black text-neutral-950 sm:text-4xl tracking-tight uppercase">{tour.name}</h1>
            {tour.description && <p className="mt-4 text-neutral-600 italic leading-relaxed">&ldquo;{tour.description}&rdquo;</p>}
          </div>

          {tour.keyExperiences.length > 0 && (
            <div>
              <h2 className="mb-3 text-lg font-bold text-neutral-950">Key Experiences</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {tour.keyExperiences.map((exp) => (
                  <span key={exp} className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3 text-sm font-medium text-neutral-800 shadow-sm">
                    <ShieldCheck className="size-4 shrink-0 text-orange-500" /> {exp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tour.assignedCar && (
            <div>
              <h2 className="mb-2 text-lg font-bold text-neutral-950">Fleet Assigned</h2>
              <p className="text-neutral-600">{tour.assignedCar.name}</p>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl space-y-4">
            <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">Starting at</span>
            <div className="text-3xl font-black text-neutral-950">₹{Number(tour.startingPrice).toLocaleString("en-IN")}</div>
            <p className="text-xs text-neutral-500">per package inclusive of taxes</p>

            <div className="flex flex-col gap-2.5 pt-2">
              {(() => {
                const whatsappNumber = (company.socialLinks?.whatsapp || company.phone || "919414551250").replace(/[^0-9]/g, "");
                const whatsappMessage = encodeURIComponent(
                  `Hello SRM Car Rentals! 👋\n\nI am interested in booking the tour package:\n\n` +
                  `• *Tour*: ${tour.name}\n` +
                  `• *Duration*: ${tour.durationDays} Days / ${tour.durationNights} Nights\n` +
                  `• *Category*: ${tour.category.name}\n` +
                  `• *Starting Price*: ₹${Number(tour.startingPrice).toLocaleString("en-IN")}\n\n` +
                  `Please share the full itinerary, vehicle assigned, and availability details!`,
                );
                return (
                  <Button asChild className="rounded-xl bg-emerald-600 font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20">
                    <a
                      href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageSquare className="size-4" /> Book via WhatsApp
                    </a>
                  </Button>
                );
              })()}
              {company.phone && (
                <Button asChild className="rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600 shadow-md shadow-orange-500/20">
                  <a href={`tel:${company.phone.replace(/\s/g, "")}`}>
                    <Phone className="size-4" /> Call to Book
                  </a>
                </Button>
              )}
              {company.email && (
                <Button asChild variant="outline" className="rounded-xl border-neutral-300 bg-neutral-50 text-neutral-800 hover:bg-neutral-100 hover:text-neutral-950">
                  <a href={`mailto:${company.email}?subject=${encodeURIComponent(`Enquiry: ${tour.name}`)}`}>
                    <Mail className="size-4" /> Enquire by Email
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
