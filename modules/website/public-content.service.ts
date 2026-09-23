import { prisma } from "@/lib/prisma";
import { getSetting } from "@/modules/settings/settings.service";
import type {
  AboutPageContent,
  CompanyContent,
  ContactPageContent,
  FaqPageContent,
  HomepageContent,
  TermsPageContent,
} from "@/modules/settings/site-content.schemas";
import type { CarCardData } from "@/components/website/car-card";
import type { ChauffeurServiceData } from "@/components/website/chauffeur-section";
import type { TourData } from "@/components/website/tours-section";

const FALLBACK_HOMEPAGE: HomepageContent = {
  hero: {
    badge: "",
    title: "DRIVE YOUR WAY.",
    highlightWord: "",
    subtitle: "Premium self-drive cars, chauffeur-driven taxis and unforgettable tours.",
    primaryCtaLabel: "Book a Car",
    primaryCtaHref: "/cars",
    secondaryCtaLabel: "Explore Fleet",
    secondaryCtaHref: "/cars",
    backgroundImageUrl: "/images/hero-car-bg.jpg",
  },
  trustBadges: [],
  philosophy: { badge: "", title: "MORE THAN A CAR RENTAL.", paragraph1: "", paragraph2: "", imageUrl: "", stats: [] },
  whyChooseUs: { badge: "", title: "WHY DRIVE WITH US?", subtitle: "", items: [] },
  b2b: { badge: "", title: "BUILT FOR BUSINESS.", subtitle: "", ctaLabel: "Partner With Us", ctaHref: "/contact-us", items: [] },
  videoShowcase: { badge: "", title: "THE ROAD IS YOURS.", subtitle: "", videoUrl: "" },
};

const FALLBACK_COMPANY: CompanyContent = {
  name: "SRM Car Rentals",
  tagline: "Self Drive & Chauffeur",
  description: "Self-drive and chauffeur-driven car rentals in Udaipur, Jaipur, and Navsari.",
  phone: "+91 9414551250",
  email: "srmrentan0171@gmail.com",
  address: "Shop No. 111, Shreyansh Complex, University Road, Udaipur, Rajasthan",
  socialLinks: { instagram: "", facebook: "", youtube: "", whatsapp: "919414551250" },
  footerLinks: { services: [], carsAndBrands: [], company: [] },
};

const FALLBACK_ABOUT: AboutPageContent = {
  hero: {
    badge: "ABOUT SRM CAR RENTALS",
    title: "DRIVE WITH CONFIDENCE & FREEDOM",
    subtitle: "Your trusted partner for self-drive and chauffeur-driven car rentals across Rajasthan and Gujarat.",
  },
  stats: [
    { value: "500+", label: "Happy Customers" },
    { value: "28+", label: "Cars in Fleet" },
    { value: "3", label: "Cities" },
    { value: "24/7", label: "Support" },
  ],
  story: {
    badge: "OUR STORY",
    title: "Redefining Mobility in Rajasthan",
    paragraph1: "Founded with a passion for automotive excellence and authentic hospitality, SRM Car Rentals is Udaipur's premier self-drive car rental agency. We believe that how you travel defines how you experience the road.",
    paragraph2: "With our extensive fleet ranging from budget-friendly hatchbacks to executive sedans and rugged 4x4 SUVs, we deliver pristine, fully insured vehicles with complete freedom. Transparent terms, instant confirmation, and 24/7 support.",
    imageUrl: "",
  },
  features: [
    { icon: "🚗", title: "Self-Drive Freedom", description: "Rent by the hour, day, week, or month. Drive on your own terms with no intrusive chaperones." },
    { icon: "🛡️", title: "Sanitized & Insured", description: "Every car is mechanically inspected, detailed, and comprehensively insured before key handover." },
    { icon: "⚡", title: "Instant Booking", description: "Book in minutes online. Quick 2-3 hour verification with doorstep delivery at airports and hotels." },
    { icon: "📞", title: "24/7 Roadside Assistance", description: "Our technical support team is always on call across Udaipur, Jaipur, and highway routes." },
  ],
  branches: [
    {
      city: "Udaipur (Headquarters)",
      phone: "+91 9414551250",
      address: "Shop No. 111, Shreyansh Complex, Opp. Daya Nasta Centre, University Road, 100 Ft. Corner, Udaipur, Rajasthan",
      mapUrl: "https://maps.google.com/?q=Shreyansh+Complex+University+Road+Udaipur",
    },
    {
      city: "Navsari (Gujarat)",
      phone: "+91 9712343241",
      address: "Shop No. 107, Surbhi Complex, Alkapuri, Shivaji Chowk, Vijalpore, Navsari, Gujarat",
      mapUrl: "https://maps.google.com/?q=Surbhi+Complex+Navsari+Gujarat",
    },
    {
      city: "Jaipur",
      phone: "+91 9680089144",
      address: "Kalwar Road, Govindpura, Jaipur, Rajasthan",
      mapUrl: "https://maps.google.com/?q=Kalwar+Road+Govindpura+Jaipur",
    },
  ],
};

const FALLBACK_CONTACT: ContactPageContent = {
  hero: {
    badge: "GET IN TOUCH",
    title: "WE'RE HERE TO HELP",
    subtitle: "Have a question about vehicle availability, custom tour packages, or airport delivery? Reach out to our friendly team.",
  },
  emergencyNotice: "Need urgent roadside assistance or emergency support? Call our 24/7 hotline: +91 9414551250",
  contactMethods: [
    { icon: "📞", label: "Phone Support", value: "+91 9414551250", href: "tel:+919414551250", description: "Direct reservations & inquiry line" },
    { icon: "💬", label: "WhatsApp Desk", value: "+91 9414551250", href: "https://wa.me/919414551250", description: "Instant responses within minutes" },
    { icon: "✉️", label: "Email Support", value: "srmrentan0171@gmail.com", href: "mailto:srmrentan0171@gmail.com", description: "Corporate bookings and document verification" },
  ],
  branches: [
    {
      city: "Udaipur",
      state: "Rajasthan",
      phone: "+91 9414551250",
      phone2: "+91 9680793858",
      address: "Shop No. 111, Shreyansh Complex, Opp. Daya Nasta Centre, University Road, 100 Ft. Corner, Udaipur",
      mapUrl: "https://maps.google.com/?q=Shreyansh+Complex+University+Road+Udaipur",
      mapEmbed: "https://maps.google.com/maps?q=Shreyansh+Complex+University+Road+Udaipur&output=embed",
      isHQ: true,
      hours: "Mon–Sun: 7:00 AM – 9:30 PM",
    },
    {
      city: "Navsari",
      state: "Gujarat",
      phone: "+91 9712343241",
      phone2: "",
      address: "Shop No. 107, Surbhi Complex, Alkapuri, Shivaji Chowk, Vijalpore, Navsari",
      mapUrl: "https://maps.google.com/?q=Surbhi+Complex+Navsari+Gujarat",
      mapEmbed: "",
      isHQ: false,
      hours: "Mon–Sun: 7:00 AM – 9:30 PM",
    },
    {
      city: "Jaipur",
      state: "Rajasthan",
      phone: "+91 9680089144",
      phone2: "",
      address: "Kalwar Road, Govindpura, Jaipur",
      mapUrl: "https://maps.google.com/?q=Kalwar+Road+Govindpura+Jaipur",
      mapEmbed: "",
      isHQ: false,
      hours: "Mon–Sun: 7:00 AM – 9:30 PM",
    },
  ],
};

const FALLBACK_FAQ: FaqPageContent = {
  badge: "GOT QUESTIONS?",
  title: "FREQUENTLY ASKED QUESTIONS",
  subtitle: "Everything you need to know about self-drive rentals, security deposits, fuel policies, and booking with SRM.",
  faqs: [
    {
      id: "what-is-srm",
      question: "What is SRM Car Rentals?",
      answer: "SRM Car Rentals is Udaipur's trusted self-drive car rental agency offering hourly, daily, and weekly rentals across Udaipur, Jaipur, and Navsari. Transparent pricing, modern fleet, and instant confirmation.",
      category: "General",
    },
    {
      id: "how-to-book",
      question: "How can I book a car?",
      answer: "Choose your vehicle on our website, select pickup and drop dates/times, complete verification, and pay securely. You will receive immediate booking confirmation.",
      category: "Booking",
    },
    {
      id: "documents-required",
      question: "What documents are required to rent a car?",
      answer: "A valid Original Driving License (LMV, minimum 3 years old) and a government-issued photo ID (Aadhaar Card, Passport, or Voter ID). Verification takes 2–3 hours before vehicle handover.",
      category: "Requirements",
    },
    {
      id: "security-deposit",
      question: "Is a security deposit required?",
      answer: "Yes, a refundable security deposit (starting at ₹5,000 depending on vehicle class) is required at pickup and refunded within 48 business hours after safe return of the vehicle.",
      category: "Payment",
    },
    {
      id: "intercity-travel",
      question: "Can I use the car for outstation or interstate travel?",
      answer: "Yes! Our vehicles have valid permits for travel across Rajasthan and neighboring states. Any inter-state taxes, toll fees, or parking charges are paid by the customer.",
      category: "Travel",
    },
    {
      id: "hourly-rental",
      question: "Are hourly rentals available?",
      answer: "Yes, SRM Car Rentals offers flexible hourly rates alongside 24-hour daily rates. You can toggle between Daily and Hourly pricing right on each vehicle card.",
      category: "Pricing",
    },
    {
      id: "cancellation",
      question: "What is the cancellation policy?",
      answer: "Cancellations made >48 hrs before pickup incur a 15% fee; 24–48 hrs is 30%; 10–24 hrs is 60%; 2–10 hrs is 80%; and within 2 hrs is 100%.",
      category: "Policies",
    },
    {
      id: "fuel-policy",
      question: "What is the fuel policy?",
      answer: "Vehicles are provided with a noted fuel level and must be returned at the same level. Excess fuel returned is non-refundable. Fuel costs are borne by the renter.",
      category: "Policies",
    },
  ],
};

const FALLBACK_TERMS: TermsPageContent = {
  hero: {
    badge: "POLICIES & GUIDELINES",
    title: "TERMS & CONDITIONS",
    subtitle: "Clear, transparent terms designed for a smooth, stress-free self-drive journey.",
  },
  importantNotice: "Confirmation of any booking implies full acceptance of these terms and conditions. Vehicles must only be driven by the verified renter.",
  sections: [
    {
      id: "eligibility",
      emoji: "📋",
      title: "Eligibility & Document Verification",
      points: [
        "Renter must be at least 21 years of age.",
        "Original Indian Driving License (LMV, non-transport) required — minimum 3 years old.",
        "Valid ID proof required: Aadhaar Card, Passport, or Voter ID.",
        "Verification takes 2–3 hours. Vehicle is handed over strictly to the registered renter.",
      ],
    },
    {
      id: "booking",
      emoji: "📅",
      title: "Booking, Pickup & Extension",
      points: [
        "Bookings auto-cancel if not picked up within 3 hours of scheduled time.",
        "No pickups or drop-offs available between 9:30 PM and 7:00 AM.",
        "Rental extensions must be requested in advance and paid upfront, subject to availability.",
        "Unapproved late returns carry rental loss charges if the next booking is impacted.",
      ],
    },
    {
      id: "delivery",
      emoji: "🚚",
      title: "Vehicle Handover & Refundable Deposit",
      points: [
        "Doorstep and Udaipur Airport (UDR) delivery available with advance scheduling.",
        "Security deposit (₹5,000–₹10,000 depending on vehicle) required at handover.",
        "Refundable deposit processed back within 48 business hours after vehicle inspection.",
      ],
    },
    {
      id: "rules",
      emoji: "🛡️",
      title: "Driving Rules & Speed Limits",
      points: [
        "Maximum speed limit is 80 km/h on state roads and 100 km/h on expressways as per Indian traffic laws.",
        "Subletting, racing, off-roading (except in authorized 4x4 vehicles), or driving under influence is strictly prohibited.",
        "All traffic fines, challans, toll fees, and border taxes during the rental period are the renter's responsibility.",
      ],
    },
    {
      id: "fuel",
      emoji: "⛽",
      title: "Fuel Policy",
      points: [
        "Vehicle is handed over with recorded fuel level and must be returned with the same level.",
        "Fuel expenses are the renter's responsibility. Excess fuel is non-refundable.",
      ],
    },
  ],
  cancellationTable: [
    { notice: "More than 48 hours before pickup", charge: "15% of total rental" },
    { notice: "24 to 48 hours before pickup", charge: "30% of total rental" },
    { notice: "10 to 24 hours before pickup", charge: "60% of total rental" },
    { notice: "2 to 10 hours before pickup", charge: "80% of total rental" },
    { notice: "Within 2 hours of pickup / No-show", charge: "100% of total rental" },
  ],
};

/**
 * Prisma `Decimal`/`Date` instances are plain-looking but are actually class
 * instances — passing them as props into a Client Component ("use client")
 * throws ("Only plain objects... can be passed to Client Components").
 * Every list here eventually feeds a client-rendered section (tab filters,
 * carousels, the booking widget), so we round-trip through JSON once at the
 * data layer: Decimal -> string, Date -> ISO string, both still safe inputs
 * to the `Number(...)` / `new Date(...)` calls used throughout the UI.
 */
function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return (await getSetting<HomepageContent>("homepage.content")) ?? FALLBACK_HOMEPAGE;
}

export async function getCompanyContent(): Promise<CompanyContent> {
  return (await getSetting<CompanyContent>("homepage.company")) ?? FALLBACK_COMPANY;
}

export async function getAboutPageContent(): Promise<AboutPageContent> {
  return (await getSetting<AboutPageContent>("pages.about")) ?? FALLBACK_ABOUT;
}

export async function getContactPageContent(): Promise<ContactPageContent> {
  return (await getSetting<ContactPageContent>("pages.contact")) ?? FALLBACK_CONTACT;
}

export async function getFaqPageContent(): Promise<FaqPageContent> {
  return (await getSetting<FaqPageContent>("pages.faq")) ?? FALLBACK_FAQ;
}

export async function getTermsPageContent(): Promise<TermsPageContent> {
  return (await getSetting<TermsPageContent>("pages.terms")) ?? FALLBACK_TERMS;
}

const CAR_CARD_INCLUDE = {
  brand: true,
  model: true,
  category: true,
  carType: true,
  transmissionType: true,
  fuelType: true,
  seatOption: true,
  doorOption: true,
  cylinderOption: true,
  steeringType: true,
  carCapacity: true,
  features: {
    include: {
      feature: true,
    },
    take: 6,
  },
  safetyFeatures: {
    include: {
      safetyFeature: true,
    },
    take: 4,
  },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  pricing: true,
} as const;

export type PublicCarCard = CarCardData & {
  category: { id: string; name: string };
  brand: { id: string; name: string };
};

export async function listActiveCars(take = 12): Promise<PublicCarCard[]> {
  const cars = await prisma.car.findMany({
    where: { status: "ACTIVE" },
    include: CAR_CARD_INCLUDE,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
  });
  return toPlain(cars) as unknown as PublicCarCard[];
}

export async function listActiveBrandsWithCarCounts() {
  const brands = await prisma.carBrand.findMany({
    where: { status: "ACTIVE", cars: { some: { status: "ACTIVE" } } },
    include: { _count: { select: { cars: { where: { status: "ACTIVE" } } } } },
    orderBy: { name: "asc" },
  });
  return brands.map((b) => ({ id: b.id, slug: b.slug, name: b.name, carCount: b._count.cars }));
}

export async function listActiveCategories() {
  return prisma.carCategory.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

export async function listActiveChauffeurServices(): Promise<ChauffeurServiceData[]> {
  const services = await prisma.chauffeurService.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
  return toPlain(services) as unknown as ChauffeurServiceData[];
}

export async function listActiveTours(take = 6): Promise<TourData[]> {
  const tours = await prisma.tour.findMany({
    where: { status: "ACTIVE" },
    include: { category: true, assignedCar: true },
    orderBy: { sortOrder: "asc" },
    take,
  });
  return toPlain(tours) as unknown as TourData[];
}

export async function listActiveTourCategories() {
  return prisma.tourCategory.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

export async function listActiveTestimonials() {
  return prisma.testimonial.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
}

export function listActiveGalleryImages(take = 8) {
  return prisma.galleryImage.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take });
}

export async function listActiveLocations() {
  const locations = await prisma.location.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  return toPlain(locations);
}

export async function listActiveAirports() {
  const airports = await prisma.airport.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  return toPlain(airports);
}

export async function listActiveInsurances() {
  const insurances = await prisma.insurance.findMany({ where: { status: "ACTIVE" }, orderBy: { fixedPrice: "asc" } });
  return toPlain(insurances);
}

export async function listActiveExtraServices() {
  const services = await prisma.extraService.findMany({ where: { status: "ACTIVE" }, orderBy: { price: "asc" } });
  return toPlain(services);
}

export async function listSimilarCars(currentCarId: string, categoryId: string, take = 3) {
  const similar = await prisma.car.findMany({
    where: {
      status: "ACTIVE",
      id: { not: currentCarId },
      categoryId,
    },
    include: CAR_CARD_INCLUDE,
    take,
    orderBy: { isFeatured: "desc" },
  });

  if (similar.length < take) {
    const fallback = await prisma.car.findMany({
      where: {
        status: "ACTIVE",
        id: { notIn: [currentCarId, ...similar.map((c) => c.id)] },
      },
      include: CAR_CARD_INCLUDE,
      take: take - similar.length,
      orderBy: { isFeatured: "desc" },
    });
    similar.push(...fallback);
  }

  return toPlain(similar) as unknown as PublicCarCard[];
}

export async function listActiveCarTypes() {
  return prisma.carType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

export async function listActiveTransmissionTypes() {
  return prisma.transmissionType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

export async function listActiveFuelTypes() {
  return prisma.fuelType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

export interface PublicCarFilters {
  categorySlug?: string;
  brandSlug?: string;
  carTypeSlug?: string;
  transmissionTypeId?: string;
  fuelTypeId?: string;
  search?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE_DEFAULT = 9;

export async function listPublicCars(filters: PublicCarFilters): Promise<{ cars: PublicCarCard[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;

  const where = {
    status: "ACTIVE" as const,
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
    ...(filters.carTypeSlug ? { carType: { slug: filters.carTypeSlug } } : {}),
    ...(filters.transmissionTypeId ? { transmissionTypeId: filters.transmissionTypeId } : {}),
    ...(filters.fuelTypeId ? { fuelTypeId: filters.fuelTypeId } : {}),
    ...(filters.search
      ? { name: { contains: filters.search, mode: "insensitive" as const } }
      : {}),
  };

  const orderBy =
    filters.sort === "price-asc"
      ? [{ pricing: { dailyPrice: "asc" as const } }]
      : filters.sort === "price-desc"
        ? [{ pricing: { dailyPrice: "desc" as const } }]
        : filters.sort === "newest"
          ? [{ createdAt: "desc" as const }]
          : [{ isFeatured: "desc" as const }, { createdAt: "desc" as const }];

  const [cars, total] = await prisma.$transaction([
    prisma.car.findMany({
      where,
      include: CAR_CARD_INCLUDE,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.car.count({ where }),
  ]);

  return { cars: toPlain(cars) as unknown as PublicCarCard[], total, page, pageSize };
}

const CAR_DETAIL_INCLUDE = {
  brand: true,
  model: true,
  category: true,
  carType: true,
  transmissionType: true,
  fuelType: true,
  steeringType: true,
  seatOption: true,
  doorOption: true,
  cylinderOption: true,
  carCapacity: true,
  color: true,
  exteriorColor: true,
  interiorColor: true,
  features: { include: { feature: true } },
  safetyFeatures: { include: { safetyFeature: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  pricing: true,
} as const;

export type PublicCarDetail = Awaited<ReturnType<typeof fetchCarDetailRaw>>;

function fetchCarDetailRaw(slug: string) {
  return prisma.car.findUnique({ where: { slug, status: "ACTIVE" }, include: CAR_DETAIL_INCLUDE });
}

export async function getPublicCarBySlug(slug: string) {
  const car = await fetchCarDetailRaw(slug);
  if (!car) return null;
  return toPlain(car);
}

export async function getPublicTourBySlug(slug: string) {
  const tour = await prisma.tour.findUnique({
    where: { slug, status: "ACTIVE" },
    include: { category: true, assignedCar: true },
  });
  if (!tour) return null;
  return toPlain(tour) as unknown as TourData & { id: string };
}

export async function getFleetCounts() {
  const [carCount, chauffeurCount, tourCount] = await prisma.$transaction([
    prisma.car.count({ where: { status: "ACTIVE" } }),
    prisma.chauffeurService.count({ where: { status: "ACTIVE" } }),
    prisma.tour.count({ where: { status: "ACTIVE" } }),
  ]);
  return { carCount, chauffeurCount, tourCount };
}
