import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bluetooth,
  Briefcase,
  Camera,
  CarFront,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cog,
  Compass,
  DoorOpen,
  Fuel,
  Gauge,
  HelpCircle,
  Info,
  Key,
  Lock,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Sun,
  Tv,
  Users,
  Wind,
  Zap,
} from "lucide-react";

function DynamicFeatureIcon({ name, className }: { name?: string | null; className?: string }) {
  const n = name?.toLowerCase();
  if (n === "airvent" || n === "wind") return <Wind className={className} />;
  if (n === "tv") return <Tv className={className} />;
  if (n === "smartphone") return <Smartphone className={className} />;
  if (n === "bluetooth") return <Bluetooth className={className} />;
  if (n === "zap") return <Zap className={className} />;
  if (n === "sun") return <Sun className={className} />;
  if (n === "camera") return <Camera className={className} />;
  if (n === "key") return <Key className={className} />;
  if (n === "gauge") return <Gauge className={className} />;
  if (n === "lock") return <Lock className={className} />;
  if (n === "shield") return <ShieldCheck className={className} />;
  return <Check className={className} />;
}

import { Badge } from "@/components/ui/badge";
import { CarGallery } from "@/components/website/car-gallery";
import { BookingEngine } from "@/components/website/booking-engine";
import { CarCard } from "@/components/website/car-card";
import { SimilarCarsCarousel } from "@/components/website/similar-cars-carousel";
import {
  getCompanyContent,
  getPublicCarBySlug,
  listActiveLocations,
  listActiveAirports,
  listActiveInsurances,
  listActiveExtraServices,
  listSimilarCars,
} from "@/modules/website/public-content.service";

interface CarDetailPageProps {
  params: Promise<{ slug: string }>;
}

import { getDynamicSeoForPath, DynamicJsonLd } from "@/lib/seo/dynamic-seo";

export async function generateMetadata({ params }: CarDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const car = await getPublicCarBySlug(slug);
  if (!car) return {};

  const fallback: Metadata = {
    title: `${car.name} Self Drive Car Rental in India | SRM Car Rentals`,
    description:
      car.shortDescription ??
      `Rent the ${car.name} self-drive with best daily rates, comprehensive insurance, doorstep & airport delivery.`,
    alternates: { canonical: `/car/${car.slug}` },
    openGraph: {
      title: `${car.name} Self Drive Rental | SRM`,
      description: car.shortDescription ?? undefined,
      images: car.images[0] ? [car.images[0].url] : undefined,
    },
  };

  const resolved = await getDynamicSeoForPath(`/car/${car.slug}`, fallback);
  return resolved.metadata;
}

function formatInr(amount: any) {
  if (amount == null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { slug } = await params;

  const [car, company, locations, airports, insurances, extraServices] = await Promise.all([
    getPublicCarBySlug(slug),
    getCompanyContent(),
    listActiveLocations(),
    listActiveAirports(),
    listActiveInsurances(),
    listActiveExtraServices(),
  ]);

  if (!car) notFound();

  const similarCars = await listSimilarCars(car.id, car.categoryId, 8);

  // Specs grid mapping dynamically derived from individual car configuration
  const specs = [
    {
      icon: Users,
      label: "Seating Capacity",
      value: car.seatOption ? `${car.seatOption.count} Persons` : (car.carCapacity?.label ?? "5 Persons"),
      subtitle: "Comfortable ergonomic seats",
    },
    {
      icon: Cog,
      label: "Transmission",
      value: car.transmissionType?.name ?? "Manual",
      subtitle: "Smooth gear shifts",
    },
    {
      icon: Fuel,
      label: "Fuel Type",
      value: car.fuelType?.name ?? "Petrol",
      subtitle: "Full tank at delivery",
    },
    {
      icon: Gauge,
      label: "Engine / Cylinders",
      value: car.cylinderOption ? `${car.cylinderOption.count} Cylinders` : "4 Cylinders",
      subtitle: car.pricing ? `${car.pricing.includedKmPerDay} km/day included` : "Smooth driving performance",
    },
    {
      icon: DoorOpen,
      label: "Doors",
      value: car.doorOption ? `${car.doorOption.count} Doors` : "4 Doors",
      subtitle: "Child-safety locks",
    },
    {
      icon: Briefcase,
      label: "Luggage Boot",
      value: car.carCapacity?.luggageCapacity || car.carCapacity?.label || "Spacious Boot Space",
      subtitle: "Trunk capacity",
    },
    {
      icon: Compass,
      label: "Steering",
      value: car.steeringType?.name ?? "Power Steering",
      subtitle: "Precision handling",
    },
    {
      icon: CarFront,
      label: "Body Category",
      value: car.category?.name ?? car.carType?.name ?? "Standard",
      subtitle: `${car.brand?.name} ${car.year}`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: car.name,
    brand: car.brand.name,
    model: car.model.name,
    vehicleModelDate: car.year,
    image: car.images[0]?.url,
    offers: car.pricing
      ? {
        "@type": "Offer",
        price: car.pricing.dailyPrice,
        priceCurrency: "INR",
      }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-neutral-900">
      <DynamicJsonLd path={`/car/${car.slug}`} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Top Breadcrumb & Trust Strip */}
      <div className="border-b border-neutral-200/80 bg-white/80 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-3 px-4 text-xs sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-neutral-500">
            <Link href="/" className="hover:text-orange-600">
              Home
            </Link>
            <ChevronRight className="size-3" />
            <Link href="/cars" className="hover:text-orange-600">
              Self Drive Fleet
            </Link>
            <ChevronRight className="size-3" />
            <span className="font-semibold text-neutral-900">{car.name}</span>
          </nav>

          <div className="flex items-center gap-4 text-neutral-600">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-600" /> Free Cancellation up to 48h
            </span>
            <span className="hidden sm:inline text-neutral-300">|</span>
            <span className="hidden sm:flex items-center gap-1 text-amber-700 font-medium">
              <Star className="size-3.5 fill-amber-500 text-amber-500" /> 4.9 (140+ Reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1520px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* LEFT COLUMN: Media, Specs, Features, Policies */}
          <div className="flex flex-col gap-8 lg:col-span-2">
            {/* Gallery */}
            <CarGallery images={car.images} name={car.name} />

            {/* Vehicle Title & Badges */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-orange-500/30 bg-orange-500/10 text-orange-600 uppercase">
                  {car.brand.name}
                </Badge>
                <Badge className="border-neutral-200 bg-neutral-100 text-neutral-700">{car.category.name}</Badge>
                <Badge className="border-neutral-200 bg-neutral-100 text-neutral-700">{car.carType.name}</Badge>
                <Badge className="border-emerald-500/30 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="mr-1 size-3 text-emerald-600" /> Instant Hold Available
                </Badge>
              </div>

              <h1 className="mt-4 text-3xl font-black text-neutral-950 sm:text-4xl">{car.name}</h1>
              <p className="mt-1 text-sm text-neutral-500">
                {car.brand.name} {car.model.name} · Model Year {car.year} · Self-Drive Rental
              </p>

              {car.shortDescription && (
                <p className="mt-4 text-sm leading-relaxed text-neutral-600">{car.shortDescription}</p>
              )}

              {/* Key Highlights Strip */}
              {car.pricing && (
                <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-4 sm:grid-cols-4">
                  <div>
                    <div className="text-[11px] text-neutral-500 uppercase font-medium">Daily Rate</div>
                    <div className="text-lg font-black text-orange-600">
                      {formatInr(car.pricing.dailyPrice)}
                      <span className="text-xs font-normal text-neutral-500"> / day</span>
                    </div>
                  </div>

                  {car.pricing.hourlyPrice && Number(car.pricing.hourlyPrice) > 0 && (
                    <div>
                      <div className="text-[11px] text-neutral-500 uppercase font-medium">Hourly Rate</div>
                      <div className="text-lg font-black text-neutral-950">
                        {formatInr(car.pricing.hourlyPrice)}
                        <span className="text-xs font-normal text-neutral-500"> / hr</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] text-neutral-500 uppercase font-medium">Included KM</div>
                    <div className="text-lg font-black text-neutral-950">{car.pricing.includedKmPerDay} km / day</div>
                  </div>

                  <div>
                    <div className="text-[11px] text-neutral-500 uppercase font-medium">Security Deposit</div>
                    <div className="text-lg font-black text-emerald-700">₹3,000–₹5,000</div>
                  </div>
                </div>
              )}
            </div>

            {/* 8-Card Technical Specs Grid */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-950">Vehicle Specifications</h2>
                <span className="text-xs text-neutral-500 font-medium">Manufacturer Verified</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {specs.map((spec, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-neutral-200/70 bg-neutral-50/80 p-3.5 transition-all hover:border-orange-500/40 hover:bg-orange-500/[0.02]"
                  >
                    <spec.icon className="size-5 text-orange-500" />
                    <div className="mt-3 text-xs font-semibold text-neutral-500">{spec.label}</div>
                    <div className="text-sm font-bold text-neutral-950">{spec.value}</div>
                    <div className="mt-0.5 text-[10px] text-neutral-400">{spec.subtitle}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* About & Description */}
            {car.description && (
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-950">About the {car.name}</h2>
                <div className="mt-3 text-sm leading-relaxed text-neutral-600 whitespace-pre-line">
                  {car.description}
                </div>
              </div>
            )}

            {/* Features & Safety Equipment */}
            {(car.features.length > 0 || car.safetyFeatures.length > 0) && (
              <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-neutral-950">Features & Safety Equipment</h2>

                {car.features.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-xs font-bold tracking-wider text-orange-600 uppercase">
                      Comfort & Infotainment
                    </h3>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {car.features.map((f) => (
                        <div
                          key={f.feature.id}
                          className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-2.5 text-xs text-neutral-800"
                        >
                          <DynamicFeatureIcon
                            name={f.feature.icon}
                            className="size-3.5 shrink-0 text-orange-500"
                          />
                          <span>{f.feature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {car.safetyFeatures.length > 0 && (
                  <div className="mt-6 border-t border-neutral-200/80 pt-4">
                    <h3 className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
                      Safety & Security Protection
                    </h3>
                    <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      {car.safetyFeatures.map((f) => (
                        <div
                          key={f.safetyFeature.id}
                          className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-2.5 text-xs text-neutral-800"
                        >
                          <DynamicFeatureIcon
                            name={f.safetyFeature.icon}
                            className="size-3.5 shrink-0 text-emerald-600"
                          />
                          <span>{f.safetyFeature.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Transparent Rental Terms & Policy Accordion */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-950">Rental Guidelines & Transparent Policies</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Everything you need to know before driving. No surprise charges or hidden clauses.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase">
                    <CheckCircle2 className="size-4 text-emerald-600" /> What is Included
                  </div>
                  <ul className="mt-2.5 flex flex-col gap-2 text-xs text-neutral-600">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 text-emerald-600" />
                      <span>Standard Comprehensive Vehicle Insurance cover</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 text-emerald-600" />
                      <span>300 Included Kilometers per calendar day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 text-emerald-600" />
                      <span>24/7 Roadside Mechanical Assistance across Rajasthan & Gujarat</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3 text-emerald-600" />
                      <span>Sanitized, detailed, and mechanically inspected vehicle</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase">
                    <Info className="size-4 text-orange-500" /> Renter Responsibility
                  </div>
                  <ul className="mt-2.5 flex flex-col gap-2 text-xs text-neutral-600">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>Fuel policy is same-to-same (return with same fuel level)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>Fastag highway tolls and parking charges paid by customer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>Original Driving License (min 1+ yrs old) + Govt Photo ID required</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                      <span>Speed limit is 80 km/h in city and 100–110 km/h on expressways</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Security deposit note */}
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-50 p-4 text-xs text-emerald-800">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                  <div className="font-bold">100% Refundable Security Deposit</div>
                  <p className="mt-0.5 text-neutral-600">
                    A refundable deposit (₹3,000–₹5,000) is collected during vehicle inspection and released directly to
                    your bank/UPI within 24 to 48 business hours after vehicle return.
                  </p>
                </div>
              </div>
            </div>

            {/* Vehicle FAQs */}
            <div className="rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-neutral-950">Frequently Asked Questions</h2>
              <div className="mt-4 flex flex-col gap-3 text-xs">
                <details className="group rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4 open:border-orange-500/40">
                  <summary className="cursor-pointer font-bold text-neutral-900 hover:text-orange-600">
                    Can I pick up this car at Udaipur Airport?
                  </summary>
                  <p className="mt-2 text-neutral-600">
                    Yes! Select &ldquo;Airport Terminal&rdquo; in the booking engine, and our executive will deliver the car
                    directly to Maharana Pratap Airport (UDR) Arrivals gate.
                  </p>
                </details>

                <details className="group rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4 open:border-orange-500/40">
                  <summary className="cursor-pointer font-bold text-neutral-900 hover:text-orange-600">
                    Can I drive to Mount Abu, Kumbhalgarh, or Jaipur?
                  </summary>
                  <p className="mt-2 text-neutral-600">
                    Absolutely. All SRM vehicles have all-Rajasthan permits and can be driven across neighboring states
                    (Gujarat, MP). Any inter-state commercial border taxes are paid by the customer at border checkpoints.
                  </p>
                </details>

                <details className="group rounded-2xl border border-neutral-200/80 bg-neutral-50/70 p-4 open:border-orange-500/40">
                  <summary className="cursor-pointer font-bold text-neutral-900 hover:text-orange-600">
                    What happens if I return the car late?
                  </summary>
                  <p className="mt-2 text-neutral-600">
                    Extra hours are calculated transparently at ₹{Number(car.pricing?.extraHourPrice ?? 150)}/hr. Please
                    notify our support team at least 2 hours in advance to extend your reservation.
                  </p>
                </details>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive Booking Engine (Sticky) */}
          <div className="lg:sticky lg:top-20 lg:h-fit">
            <BookingEngine
              carId={car.id}
              carSlug={car.slug}
              carName={car.name}
              carImage={car.images[0]?.url}
              fuelType={car.fuelType?.name || "Diesel"}
              dailyPrice={Number(car.pricing?.dailyPrice ?? 1500)}
              hourlyPrice={car.pricing?.hourlyPrice ? Number(car.pricing.hourlyPrice) : null}
              includedKmPerDay={car.pricing?.includedKmPerDay ?? 300}
              phone={company.phone}
              locations={locations}
              airports={airports}
              insurances={insurances}
              extraServices={extraServices}
            />
          </div>
        </div>

        {/* FULL-WIDTH SECTION: Similar Cars single-row carousel (Not restricted to left column) */}
        {similarCars.length > 0 && (
          <div className="mt-16 border-t border-neutral-200/80 pt-12">
            <SimilarCarsCarousel cars={similarCars} />
          </div>
        )}
      </div>
    </div>
  );
}
