import { unstable_cache } from "next/cache";

import { makeT } from "@/lib/copy/translate";
import { toSlug } from "@/lib/slug";
import { getKmPlansConfigForPickup } from "@/lib/pricing/km-plans.server";
import { resolveCarKmPlans, resolveCarKmPlansByLocation } from "@/lib/pricing/km-plans";

import { isRichHtml, sanitizeRichHtml } from "@/lib/rich-text";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/modules/settings/settings.service";
import { DEFAULT_SITE_TEXT, siteTextSchema, type SiteText } from "@/modules/settings/site-content.schemas";
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
    badge: "SRM CAR RENTALS",
    title: "DRIVE YOUR WAY.",
    highlightWord: "YOUR WAY.",
    subtitle: "Premium self-drive cars, chauffeur-driven taxis and unforgettable tours across Rajasthan & Gujarat.",
    primaryCtaLabel: "Book a Car",
    primaryCtaHref: "/cars",
    secondaryCtaLabel: "Explore Fleet",
    secondaryCtaHref: "/cars",
    backgroundImageUrl: "/images/hero-car-bg.jpg",
    backgroundImages: [],
  },
  trustBadges: [
    { icon: "ShieldCheck", label: "Zero Security Deposit Options" },
    { icon: "Zap", label: "Instant Digital KYC & Handover" },
    { icon: "CarFront", label: "100% Sanitized & Insured Fleet" },
    { icon: "PhoneCall", label: "24/7 Roadside Mechanical Support" },
  ],
  philosophy: {
    badge: "OUR PHILOSOPHY",
    title: "MORE THAN A CAR RENTAL.",
    paragraph1: "We believe renting a car should feel like owning the journey. Every vehicle in our fleet is maintained to dealership standards, thoroughly sanitized, and inspected before handover.",
    paragraph2: "Whether you need an economical hatchback for Udaipur city errands, a rugged 4x4 for Kumbhalgarh or Mount Abu mountain getaways, or a chauffeur-driven luxury sedan for a royal wedding, we deliver freedom on wheels with no hidden surprises.",
    imageUrl: "",
    stats: [
      { value: "500+", label: "Happy Journeys" },
      { value: "28+", label: "Premium Cars" },
      { value: "100%", label: "Verified & Insured" },
      { value: "24/7", label: "On-Road Support" },
    ],
  },
  whyChooseUs: {
    badge: "WHY SRM",
    title: "WHY DRIVE WITH US?",
    subtitle: "Experience seamless mobility with unmatched service standards.",
    items: [
      { icon: "ShieldCheck", title: "Comprehensive Insurance", description: "All vehicles carry full commercial insurance with zero liability headache." },
      { icon: "Zap", title: "Flexible Hourly & Daily", description: "Hourly, daily, weekly, or monthly rentals tailored to your travel plans." },
      { icon: "MapPin", title: "Doorstep & Airport Delivery", description: "Pickup and drop at airports, railway stations, hotels, or your home." },
      { icon: "Wrench", title: "Pristine Maintenance", description: "Every car is mechanically tested, detailed, and inspected before each trip." },
    ],
  },
  b2b: {
    badge: "CORPORATE & EVENTS",
    title: "BUILT FOR BUSINESS.",
    subtitle: "Corporate travel, wedding fleets, and event logistics customized for your scale.",
    ctaLabel: "Partner With Us",
    ctaHref: "/contact-us",
    phoneLabel: "Talk to Our Team",
    imageUrl: "",
    backgroundImageUrl: "",
    stats: [
      { value: "500+", label: "Corporate Clients", highlight: false },
      { value: "24/7", label: "Fleet Support", highlight: false },
      { value: "B2B", label: "Preferred Rates", highlight: true },
    ],
    items: [
      { icon: "Briefcase", title: "Corporate Accounts", description: "GST invoicing, monthly billing, and dedicated relationship manager." },
      { icon: "PartyPopper", title: "Weddings & VIP Events", description: "Uniformed chauffeurs, luxury convoy management, and decorated cars." },
      { icon: "Plane", title: "Airport Delegation", description: "Coordinated flight tracking and seamless guest transfers." },
    ],
  },
  videoShowcase: {
    badge: "EXPERIENCE",
    title: "THE ROAD IS YOURS.",
    subtitle: "From desert highways to lakeside palace routes, write your own travel stories.",
    videoUrl: "",
  },
};

const FALLBACK_COMPANY: CompanyContent = {
  name: "SRM Car Rentals",
  tagline: "Self Drive & Chauffeur",
  description: "Self-drive and chauffeur-driven car rentals in Udaipur, Jaipur, and Navsari. Transparent pricing with instant confirmation.",
  phone: "+91 9414551250",
  email: "srmrentan0171@gmail.com",
  address: "Shop No. 111, Shreyansh Complex, University Road, Udaipur, Rajasthan",
  socialLinks: { instagram: "https://instagram.com/srmcarrentals", facebook: "", youtube: "", whatsapp: "919414551250" },
  footerLinks: {
    services: [
      { label: "Self Drive Cars", href: "/cars" },
      { label: "Chauffeur Taxi", href: "/car-rental" },
      { label: "Tour Packages", href: "/tours" },
      { label: "Airport Transfers", href: "/car-rental" },
    ],
    carsAndBrands: [
      { label: "SUV Fleet", href: "/cars?category=suv" },
      { label: "Sedan Fleet", href: "/cars?category=sedan" },
      { label: "Luxury Cars", href: "/cars?category=luxury" },
      { label: "Hourly Rental", href: "/cars" },
    ],
    company: [
      { label: "About Us", href: "/about-us" },
      { label: "Contact Us", href: "/contact-us" },
      { label: "FAQs", href: "/faq" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
    ],
  },
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
    { icon: "CarFront", title: "Self-Drive Freedom", description: "Rent by the hour, day, week, or month. Drive on your own terms with no intrusive chaperones." },
    { icon: "ShieldCheck", title: "Sanitized & Insured", description: "Every car is mechanically inspected, detailed, and comprehensively insured before key handover." },
    { icon: "Zap", title: "Instant Booking", description: "Book in minutes online. Quick 2-3 hour verification with doorstep delivery at airports and hotels." },
    { icon: "PhoneCall", title: "24/7 Roadside Assistance", description: "Our technical support team is always on call across Udaipur, Jaipur, and highway routes." },
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
    { icon: "PhoneCall", label: "Phone Support", value: "+91 9414551250", href: "tel:+919414551250", description: "Direct reservations & inquiry line" },
    { icon: "MessageCircle", label: "WhatsApp Desk", value: "+91 9414551250", href: "https://wa.me/919414551250", description: "Instant responses within minutes" },
    { icon: "Mail", label: "Email Support", value: "srmrentan0171@gmail.com", href: "mailto:srmrentan0171@gmail.com", description: "Corporate bookings and document verification" },
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
/** Public pages share one Neon round-trip per cache window instead of one per
 * request. Only JSON-safe readers are wrapped (cache serialises to JSON). */
const PUBLIC_REVALIDATE_SECONDS = 60;
function cached<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>) {
  return unstable_cache(fn, ["public-content", name], {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: ["public-content"],
  });
}

/** Adds each car's 3 KM plans (admin prices, else calculated) so cards and pages show identical numbers. */
async function attachKmPlans<T extends { id: string; pricing?: any }>(cars: T[]) {
  const cfg = await getKmPlansConfigForPickup();
  return cars.map((c) => {
    if (!c.pricing) return { ...c, kmPlans: undefined, kmPlansByLocation: undefined };
    const input = {
      id: c.id,
      dailyPrice: Number(c.pricing.dailyPrice),
      hourlyPrice: c.pricing.hourlyPrice != null ? Number(c.pricing.hourlyPrice) : null,
      includedKmPerDay: Number(c.pricing.includedKmPerDay ?? 120),
      extraKmPrice: Number(c.pricing.extraKmPrice ?? 10),
    };
    return { ...c, kmPlans: resolveCarKmPlans(input, cfg), kmPlansByLocation: resolveCarKmPlansByLocation(input, cfg) };
  });
}

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

async function getHomepageContent_uncached(): Promise<HomepageContent> {
  return (await getSetting<HomepageContent>("homepage.content")) ?? FALLBACK_HOMEPAGE;
}

async function getCompanyContent_uncached(): Promise<CompanyContent> {
  return (await getSetting<CompanyContent>("homepage.company")) ?? FALLBACK_COMPANY;
}

async function getAboutPageContent_uncached(): Promise<AboutPageContent> {
  return (await getSetting<AboutPageContent>("pages.about")) ?? FALLBACK_ABOUT;
}

async function getContactPageContent_uncached(): Promise<ContactPageContent> {
  return (await getSetting<ContactPageContent>("pages.contact")) ?? FALLBACK_CONTACT;
}

async function getFaqPageContent_uncached(): Promise<FaqPageContent> {
  const faq = (await getSetting<FaqPageContent>("pages.faq")) ?? FALLBACK_FAQ;
  // Answers written in the rich-text editor are HTML: sanitize once here, before they reach the page.
  return { ...faq, faqs: faq.faqs.map((f) => (isRichHtml(f.answer) ? { ...f, answer: sanitizeRichHtml(f.answer) } : f)) };
}

async function getTermsPageContent_uncached(): Promise<TermsPageContent> {
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
  images: { orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }] as ({ isFeatured: "desc" } | { sortOrder: "asc" })[], take: 1 },
  pricing: true,
  locations: { include: { location: true } },
} as const;

export type PublicCarCard = CarCardData & {
  category: { id: string; name: string };
  brand: { id: string; name: string };
};

async function listActiveCars_uncached(take = 12): Promise<PublicCarCard[]> {
  try {
    const cars = await prisma.car.findMany({
      where: { status: "ACTIVE" },
      include: CAR_CARD_INCLUDE,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take,
    });
    return toPlain(await attachKmPlans(cars)) as unknown as PublicCarCard[];
  } catch { return []; }
}

export async function listActiveBrandsWithCarCounts() {
  try {
    const brands = await prisma.carBrand.findMany({
      where: { status: "ACTIVE", cars: { some: { status: "ACTIVE" } } },
      include: { _count: { select: { cars: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    });
    return brands.map((b) => ({ id: b.id, slug: b.slug, name: b.name, carCount: b._count.cars }));
  } catch { return []; }
}

/** Active categories with how many active cars each has (for the homepage category circles). */
async function listCategoriesWithCounts_uncached() {
  try {
    const rows = await prisma.carCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, imageUrl: true, _count: { select: { cars: { where: { status: "ACTIVE" } } } } },
    });
    return rows.map((c) => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.imageUrl, carCount: c._count.cars })).filter((c) => c.carCount > 0);
  } catch {
    return [];
  }
}

export async function listActiveCategories() {
  try {
    return await prisma.carCategory.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  } catch { return []; }
}

async function listActiveChauffeurServices_uncached(): Promise<ChauffeurServiceData[]> {
  try {
    const services = await prisma.chauffeurService.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" } });
    return toPlain(services) as unknown as ChauffeurServiceData[];
  } catch { return []; }
}

async function listActiveTours_uncached(take = 6): Promise<TourData[]> {
  try {
    const tours = await prisma.tour.findMany({
      where: { status: "ACTIVE" },
      include: { category: true, assignedCar: true },
      orderBy: { sortOrder: "asc" },
      take,
    });
    return toPlain(tours) as unknown as TourData[];
  } catch { return []; }
}

export async function listActiveTourCategories() {
  try {
    return await prisma.tourCategory.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  } catch { return []; }
}

const DEFAULT_TESTIMONIALS = [
  {
    id: "t1",
    customerName: "Vikramaditya Rathore",
    location: "Jaipur, Rajasthan",
    avatarUrl: null,
    rating: 5,
    quote: "Rented an Innova Crysta for a 5-day family trip to Kumbhalgarh and Udaipur. The vehicle was spotless, sanitized, and delivered right on time at Maharana Pratap Airport. Flawless experience!",
    bookedItem: "Toyota Innova Crysta",
    source: "google",
  },
  {
    id: "t2",
    customerName: "Neha Sharma",
    location: "Ahmedabad, Gujarat",
    avatarUrl: null,
    rating: 5,
    quote: "Best self-drive car rental agency in Udaipur by far! Transparent pricing with no hidden fees, instant WhatsApp communication, and zero-hassle security deposit refund.",
    bookedItem: "Hyundai Creta",
    source: "google",
  },
  {
    id: "t3",
    customerName: "Amitabh Banerjee",
    location: "Kolkata, WB",
    avatarUrl: null,
    rating: 5,
    quote: "Took a Mahindra Thar for our Mount Abu expedition. Car was in top mechanical condition. 24/7 support gave us huge peace of mind on highway twists.",
    bookedItem: "Mahindra Thar 4x4",
    source: "google",
  },
];

export async function listActiveTestimonials() {
  try {
    const list = await prisma.testimonial.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    });
    return list.length > 0 ? list : DEFAULT_TESTIMONIALS;
  } catch {
    return DEFAULT_TESTIMONIALS;
  }
}

const DEFAULT_GALLERY = [
  { id: "g1", imageUrl: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80&auto=format&fit=crop", caption: "Udaipur Lake Palace Route", link: null },
  { id: "g2", imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop", caption: "Highway Luxury Drive", link: null },
  { id: "g3", imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop", caption: "Thar Off-Road Expedition", link: null },
  { id: "g4", imageUrl: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80&auto=format&fit=crop", caption: "Airport Handover", link: null },
];

export async function listActiveGalleryImages(take = 8) {
  try {
    const list = await prisma.galleryImage.findMany({ where: { status: "ACTIVE" }, orderBy: { sortOrder: "asc" }, take });
    return list.length > 0 ? list : DEFAULT_GALLERY.slice(0, take);
  } catch {
    return DEFAULT_GALLERY.slice(0, take);
  }
}

async function listActiveLocations_uncached() {
  try {
    const locations = await prisma.location.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
    return toPlain(locations);
  } catch { return []; }
}

async function listActiveAirports_uncached() {
  try {
    const airports = await prisma.airport.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
    return toPlain(airports);
  } catch { return []; }
}

async function listActiveInsurances_uncached() {
  try {
    const insurances = await prisma.insurance.findMany({ where: { status: "ACTIVE" }, orderBy: { fixedPrice: "asc" } });
    return toPlain(insurances);
  } catch { return []; }
}

async function listActiveExtraServices_uncached() {
  try {
    const services = await prisma.extraService.findMany({ where: { status: "ACTIVE" }, orderBy: { price: "asc" } });
    return toPlain(services);
  } catch { return []; }
}

async function listSimilarCars_uncached(currentCarId: string, categoryId: string, take = 3) {
  try {
    const similar = await prisma.car.findMany({
      where: { status: "ACTIVE", id: { not: currentCarId }, categoryId },
      include: CAR_CARD_INCLUDE,
      take,
      orderBy: { isFeatured: "desc" },
    });

    if (similar.length < take) {
      const fallback = await prisma.car.findMany({
        where: {
          status: "ACTIVE",
          id: { notIn: [currentCarId, ...similar.map((c: any) => c.id)] },
        },
        include: CAR_CARD_INCLUDE,
        take: take - similar.length,
        orderBy: { isFeatured: "desc" },
      });
      similar.push(...fallback);
    }

    return toPlain(await attachKmPlans(similar)) as unknown as PublicCarCard[];
  } catch { return []; }
}

export async function listActiveCarTypes() {
  try {
    return await prisma.carType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  } catch { return []; }
}

export async function listActiveTransmissionTypes() {
  try {
    return await prisma.transmissionType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  } catch { return []; }
}

export async function listActiveFuelTypes() {
  try {
    return await prisma.fuelType.findMany({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
  } catch { return []; }
}

export interface PublicCarFilters {
  categorySlug?: string;
  brandSlug?: string;
  carTypeSlug?: string;
  transmissionTypeId?: string;
  fuelTypeId?: string;
  locationId?: string;
  /** City name — cars available in that city (a pickup point filters by its city). */
  city?: string;
  search?: string;
  sort?: "featured" | "price-asc" | "price-desc" | "newest";
  page?: number;
  pageSize?: number;
}

const PAGE_SIZE_DEFAULT = 9;

/** URLs use readable slugs; accept an id too so old links keep working. */
async function resolveNamedRef(model: "transmissionType" | "fuelType", ref?: string): Promise<string | undefined> {
  if (!ref) return undefined;
  const rows: { id: string; name: string }[] = await (prisma[model] as any).findMany({ select: { id: true, name: true } });
  const wanted = ref.toLowerCase();
  return rows.find((r) => r.id === ref || toSlug(r.name) === wanted)?.id ?? ref;
}
/** The city a pickup point belongs to (cars are available per city, pickup points sit under a city). */
async function resolveCityForLocation(ref?: string): Promise<string | undefined> {
  if (!ref || ref === "all") return undefined;
  const loc = await prisma.location.findFirst({ where: { OR: [{ id: ref }, { slug: ref }] }, select: { city: true } });
  return loc?.city?.replace(/\s*\(.*\)\s*$/, "").trim() || undefined;
}
async function resolveLocationRef(ref?: string): Promise<string | undefined> {
  if (!ref || ref === "all") return ref;
  const loc = await prisma.location.findFirst({ where: { OR: [{ id: ref }, { slug: ref }] }, select: { id: true } });
  return loc?.id ?? ref;
}

async function listPublicCars_uncached(filters: PublicCarFilters): Promise<{ cars: PublicCarCard[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGE_SIZE_DEFAULT;

  try {
    const [transmissionTypeId, fuelTypeId, locationCity] = await Promise.all([
      resolveNamedRef("transmissionType", filters.transmissionTypeId),
      resolveNamedRef("fuelType", filters.fuelTypeId),
      resolveCityForLocation(filters.locationId),
    ]);
    const city = (filters.city && filters.city !== "all" ? filters.city : locationCity)?.trim();
    const where = {
      status: "ACTIVE" as const,
      ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
      ...(filters.brandSlug ? { brand: { slug: filters.brandSlug } } : {}),
      ...(filters.carTypeSlug ? { carType: { slug: filters.carTypeSlug } } : {}),
      ...(transmissionTypeId ? { transmissionTypeId } : {}),
      ...(fuelTypeId ? { fuelTypeId } : {}),
      // Cars are available per city: any car with a pickup point in that city (or not tied to a city yet)
      ...(city
        ? {
            OR: [
              { locations: { some: { location: { city: { startsWith: city, mode: "insensitive" as const } } } } },
              { locations: { none: {} } },
            ],
          }
        : {}),
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

    const [cars, total] = await Promise.all([
      prisma.car.findMany({ where, include: CAR_CARD_INCLUDE, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.car.count({ where }),
    ]);

    return { cars: toPlain(await attachKmPlans(cars)) as unknown as PublicCarCard[], total, page, pageSize };
  } catch {
    return { cars: [], total: 0, page, pageSize };
  }
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
  locations: { include: { location: true } },
  images: { orderBy: { sortOrder: "asc" as const } },
  pricing: true,
} as const;

export type PublicCarDetail = Awaited<ReturnType<typeof fetchCarDetailRaw>>;

function fetchCarDetailRaw(slug: string) {
  return prisma.car.findUnique({ where: { slug, status: "ACTIVE" }, include: CAR_DETAIL_INCLUDE });
}

async function getPublicCarBySlug_uncached(slug: string) {
  try {
    const car = await fetchCarDetailRaw(slug);
    if (!car) return null;
    // Featured photo first (stable for the rest), so the gallery and cards show the same lead image.
    const images = [...car.images].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    const [withPlans] = await attachKmPlans([car]);
    return toPlain({ ...withPlans!, images });
  } catch { return null; }
}

async function getPublicTourBySlug_uncached(slug: string) {
  try {
    const tour = await prisma.tour.findUnique({
      where: { slug, status: "ACTIVE" },
      include: { category: true, assignedCar: true },
    });
    if (!tour) return null;
    return toPlain(tour) as unknown as TourData & { id: string };
  } catch { return null; }
}

async function getFleetCounts_uncached() {
  try {
    const [carCount, chauffeurCount, tourCount] = await Promise.all([
      prisma.car.count({ where: { status: "ACTIVE" } }),
      prisma.chauffeurService.count({ where: { status: "ACTIVE" } }),
      prisma.tour.count({ where: { status: "ACTIVE" } }),
    ]);
    return { carCount, chauffeurCount, tourCount };
  } catch {
    return { carCount: 0, chauffeurCount: 0, tourCount: 0 };
  }
}

async function getPublicBlogs_uncached(params?: {
  categorySlug?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(50, Math.max(1, params?.limit || 12));
    const skip = (page - 1) * limit;

    const where: any = {
      status: "PUBLISHED",
    };

    if (params?.categorySlug && params.categorySlug !== "all") {
      where.category = { slug: params.categorySlug };
    }

    if (params?.tag) {
      where.tags = { has: params.tag };
    }

    if (params?.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
        { tags: { has: q } },
      ];
    }

    const [total, blogs] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);

    const items = blogs.map((b: any) => {
      const words = b.content ? b.content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
      const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
      return {
        ...toPlain(b),
        readTimeMinutes,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Failed to fetch public blogs:", error);
    return {
      items: [],
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 0,
    };
  }
}

async function getPublicBlogCategories_uncached() {
  try {
    const categories = await prisma.blogCategory.findMany({
      where: {
        status: "ACTIVE",
        blogs: { some: { status: "PUBLISHED" } },
      },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { blogs: { where: { status: "PUBLISHED" } } },
        },
      },
    });
    return toPlain(categories);
  } catch {
    return [];
  }
}

async function getPublicBlogBySlug_uncached(slug: string) {
  try {
    const blog = await prisma.blog.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: true,
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
        seoMetadata: true,
      },
    });

    if (!blog) return null;

    const words = blog.content ? blog.content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));

    return {
      ...toPlain(blog),
      readTimeMinutes,
    };
  } catch {
    return null;
  }
}

async function getRelatedPublicBlogs_uncached(currentSlug: string, categoryId?: string, limit = 3) {
  try {
    const where: any = {
      status: "PUBLISHED",
      slug: { not: currentSlug },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    let blogs = await prisma.blog.findMany({
      where,
      take: limit,
      orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { firstName: true, lastName: true } },
      },
    });

    if (blogs.length < limit && categoryId) {
      // Backfill with other recent blogs
      const more = await prisma.blog.findMany({
        where: {
          status: "PUBLISHED",
          slug: { notIn: [currentSlug, ...blogs.map((b: any) => b.slug)] },
        },
        take: limit - blogs.length,
        orderBy: [{ publishDate: "desc" }, { createdAt: "desc" }],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { firstName: true, lastName: true } },
        },
      });
      blogs = [...blogs, ...more];
    }

    return toPlain(blogs).map((b: any) => {
      const words = b.content ? b.content.replace(/<[^>]*>/g, "").split(/\s+/).length : 0;
      return {
        ...b,
        readTimeMinutes: Math.max(1, Math.ceil(words / 200)),
      };
    });
  } catch {
    return [];
  }
}

import { getAvailableServices as getAvailableServicesUncached } from "@/modules/settings/settings.service";
export { DEFAULT_AVAILABLE_SERVICES } from "@/modules/settings/settings.service";
export const getAvailableServices = cached("getAvailableServices", getAvailableServicesUncached);

export const getHomepageContent = cached("getHomepageContent", getHomepageContent_uncached);
export const listCategoriesWithCounts = cached("listCategoriesWithCounts", listCategoriesWithCounts_uncached);

/** Site-wide labels & headings, editable in admin ("homepage.text"); missing fields fall back to defaults. */
async function getSiteText_uncached(): Promise<SiteText> {
  const stored = await getSetting<unknown>("homepage.text");
  const parsed = siteTextSchema.safeParse(stored ?? {});
  return parsed.success ? parsed.data : DEFAULT_SITE_TEXT;
}
export const getSiteText = cached("getSiteText", getSiteText_uncached);

/** Admin overrides for page copy (`homepage.copy`); empty when nothing was customised. */
async function getCopyOverrides_uncached(): Promise<Record<string, string>> {
  const stored = await getSetting<Record<string, string>>("homepage.copy");
  return stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
}
export const getCopyOverrides = cached("getCopyOverrides", getCopyOverrides_uncached);

/** Server-side translate function for server components. */
export async function getT() {
  return makeT(await getCopyOverrides());
}
export const getCompanyContent = cached("getCompanyContent", getCompanyContent_uncached);
export const getAboutPageContent = cached("getAboutPageContent", getAboutPageContent_uncached);
export const getContactPageContent = cached("getContactPageContent", getContactPageContent_uncached);
export const getFaqPageContent = cached("getFaqPageContent", getFaqPageContent_uncached);
export const getTermsPageContent = cached("getTermsPageContent", getTermsPageContent_uncached);
export const listActiveCars = cached("listActiveCars", listActiveCars_uncached);
export const listActiveChauffeurServices = cached("listActiveChauffeurServices", listActiveChauffeurServices_uncached);
export const listActiveTours = cached("listActiveTours", listActiveTours_uncached);
export const listActiveLocations = cached("listActiveLocations", listActiveLocations_uncached);
export const listActiveAirports = cached("listActiveAirports", listActiveAirports_uncached);
export const listActiveInsurances = cached("listActiveInsurances", listActiveInsurances_uncached);
export const listActiveExtraServices = cached("listActiveExtraServices", listActiveExtraServices_uncached);
export const listSimilarCars = cached("listSimilarCars", listSimilarCars_uncached);
export const listPublicCars = cached("listPublicCars", listPublicCars_uncached);
export const getPublicCarBySlug = cached("getPublicCarBySlug", getPublicCarBySlug_uncached);
export const getPublicTourBySlug = cached("getPublicTourBySlug", getPublicTourBySlug_uncached);
export const getFleetCounts = cached("getFleetCounts", getFleetCounts_uncached);
export const getPublicBlogs = cached("getPublicBlogs", getPublicBlogs_uncached);
export const getPublicBlogCategories = cached("getPublicBlogCategories", getPublicBlogCategories_uncached);
export const getPublicBlogBySlug = cached("getPublicBlogBySlug", getPublicBlogBySlug_uncached);
export const getRelatedPublicBlogs = cached("getRelatedPublicBlogs", getRelatedPublicBlogs_uncached);
export type { AvailableServicesConfig } from "@/modules/settings/site-content.schemas";

