import { z } from "zod";

const linkSchema = z.object({ label: z.string().min(1), href: z.string().min(1) });
const iconCardSchema = z.object({
  icon: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

/** Setting key: "homepage.content" — every free-form marketing copy block on
 * the public homepage. Nothing here is hardcoded in the frontend. */
export const homepageContentSchema = z.object({
  hero: z.object({
    badge: z.string().default(""),
    title: z.string().min(1),
    highlightWord: z.string().default(""),
    subtitle: z.string().default(""),
    primaryCtaLabel: z.string().default("Book a Car"),
    primaryCtaHref: z.string().default("/cars"),
    secondaryCtaLabel: z.string().default("Explore Fleet"),
    secondaryCtaHref: z.string().default("/cars"),
    backgroundImageUrl: z.string().optional().or(z.literal("")),
    /** Extra slides for the hero carousel (the main background image is always slide 1). */
    backgroundImages: z.array(z.string()).default([]),
  }),
  trustBadges: z.array(z.object({ icon: z.string().min(1), label: z.string().min(1) })).default([]),
  philosophy: z.object({
    badge: z.string().default(""),
    title: z.string().min(1),
    paragraph1: z.string().default(""),
    paragraph2: z.string().default(""),
    imageUrl: z.string().optional().or(z.literal("")),
    stats: z.array(z.object({ value: z.string().min(1), label: z.string().min(1) })).default([]),
  }),
  whyChooseUs: z.object({
    badge: z.string().default(""),
    title: z.string().min(1),
    subtitle: z.string().default(""),
    items: z.array(iconCardSchema).default([]),
  }),
  b2b: z.object({
    badge: z.string().default(""),
    title: z.string().min(1),
    subtitle: z.string().default(""),
    ctaLabel: z.string().default("Partner With Us"),
    ctaHref: z.string().default("/contact-us"),
    items: z.array(iconCardSchema).default([]),
  }),
  videoShowcase: z.object({
    badge: z.string().default(""),
    title: z.string().min(1),
    subtitle: z.string().default(""),
    videoUrl: z.string().optional().or(z.literal("")),
  }),
});
export type HomepageContent = z.infer<typeof homepageContentSchema>;

/** Setting key: "homepage.company" — brand/contact info shared across the
 * header, footer, and any "talk to us" CTAs. */
export const companyContentSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().default(""),
  description: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
  address: z.string().default(""),
  socialLinks: z
    .object({
      instagram: z.string().optional().or(z.literal("")),
      facebook: z.string().optional().or(z.literal("")),
      youtube: z.string().optional().or(z.literal("")),
      whatsapp: z.string().optional().or(z.literal("")),
      linkedin: z.string().optional().or(z.literal("")),
      twitter: z.string().optional().or(z.literal("")),
      telegram: z.string().optional().or(z.literal("")),
    })
    .default({}),
  footerLinks: z
    .object({
      services: z.array(linkSchema).default([]),
      carsAndBrands: z.array(linkSchema).default([]),
      company: z.array(linkSchema).default([]),
    })
    .default({ services: [], carsAndBrands: [], company: [] }),
});
export type CompanyContent = z.infer<typeof companyContentSchema>;

/** Setting key: "pages.about" — About Us page content */
export const aboutPageContentSchema = z.object({
  hero: z.object({
    badge: z.string().default("ABOUT SRM CAR RENTALS"),
    title: z.string().default("DRIVE WITH CONFIDENCE & FREEDOM"),
    subtitle: z.string().default("Your trusted partner for self-drive and chauffeur-driven car rentals in Udaipur, Jaipur, Navsari and beyond."),
  }),
  stats: z.array(z.object({
    value: z.string().min(1),
    label: z.string().min(1),
  })).default([
    { value: "500+", label: "Happy Customers" },
    { value: "28+", label: "Cars in Fleet" },
    { value: "3", label: "Cities" },
    { value: "24/7", label: "Support" },
  ]),
  story: z.object({
    badge: z.string().default("OUR STORY"),
    title: z.string().default("Redefining Mobility in Rajasthan"),
    paragraph1: z.string().default("Founded with a passion for automobiles and hospitality, SRM Car Rentals is Udaipur's premier self-drive car rental agency. We believe renting a car should be simple, transparent, and exhilarating."),
    paragraph2: z.string().default("With our modern fleet of hatchbacks, executive sedans, rugged 4x4s, and family MPVs, we provide immaculate vehicles with complete freedom. Zero hidden charges, 24/7 roadside assistance, and transparent pricing."),
    imageUrl: z.string().optional().or(z.literal("")),
  }),
  features: z.array(z.object({
    icon: z.string().default("🚗"),
    title: z.string().min(1),
    description: z.string().min(1),
  })).default([]),
  branches: z.array(z.object({
    city: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    mapUrl: z.string().optional().or(z.literal("")),
  })).default([]),
});
export type AboutPageContent = z.infer<typeof aboutPageContentSchema>;

/** Setting key: "pages.contact" — Contact Us page content */
export const contactPageContentSchema = z.object({
  hero: z.object({
    badge: z.string().default("GET IN TOUCH"),
    title: z.string().default("WE'RE HERE TO HELP"),
    subtitle: z.string().default("Questions about our fleet, pricing, or custom tour itineraries? Reach out anytime."),
  }),
  emergencyNotice: z.string().default("Need urgent assistance or roadside support? Call our 24/7 emergency hotline: +91 9414551250"),
  contactMethods: z.array(z.object({
    icon: z.string().default("📞"),
    label: z.string().min(1),
    value: z.string().min(1),
    href: z.string().min(1),
    description: z.string().default(""),
  })).default([]),
  branches: z.array(z.object({
    city: z.string().min(1),
    state: z.string().min(1),
    phone: z.string().min(1),
    phone2: z.string().optional().or(z.literal("")),
    address: z.string().min(1),
    mapUrl: z.string().optional().or(z.literal("")),
    mapEmbed: z.string().optional().or(z.literal("")),
    isHQ: z.boolean().default(false),
    hours: z.string().default("Mon–Sat: 7:00 AM – 9:30 PM"),
  })).default([]),
});
export type ContactPageContent = z.infer<typeof contactPageContentSchema>;

/** Setting key: "pages.faq" — FAQ list for Home & FAQ pages */
export const faqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().default("General"),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

export const faqPageContentSchema = z.object({
  badge: z.string().default("GOT QUESTIONS?"),
  title: z.string().default("FREQUENTLY ASKED QUESTIONS"),
  subtitle: z.string().default("Everything you need to know about self-drive rentals, deposits, fuel policy, and booking with SRM."),
  faqs: z.array(faqItemSchema).default([]),
});
export type FaqPageContent = z.infer<typeof faqPageContentSchema>;

/** Setting key: "pages.terms" — Terms & Conditions content */
export const termsSectionSchema = z.object({
  id: z.string().min(1),
  emoji: z.string().default("📋"),
  title: z.string().min(1),
  points: z.array(z.string()).default([]),
});
export type TermsSection = z.infer<typeof termsSectionSchema>;

export const cancellationRowSchema = z.object({
  notice: z.string().min(1),
  charge: z.string().min(1),
});
export type CancellationRow = z.infer<typeof cancellationRowSchema>;

export const termsPageContentSchema = z.object({
  hero: z.object({
    badge: z.string().default("POLICIES & GUIDELINES"),
    title: z.string().default("TERMS & CONDITIONS"),
    subtitle: z.string().default("Clear, transparent rules for an effortless self-drive experience."),
  }),
  importantNotice: z.string().default("Please read the rental agreement carefully. Confirmation of a booking implies full acceptance of these terms and conditions."),
  sections: z.array(termsSectionSchema).default([]),
  cancellationTable: z.array(cancellationRowSchema).default([]),
});
export type TermsPageContent = z.infer<typeof termsPageContentSchema>;

export const availableServicesSchema = z.object({
  cars: z.boolean().default(true),
  taxi: z.boolean().default(true),
  tours: z.boolean().default(true),
});
export type AvailableServicesConfig = z.infer<typeof availableServicesSchema>;


const s = (v: string) => z.string().default(v);
const heading = (badge: string, title: string, subtitle = "") =>
  z.object({ badge: s(badge), title: s(title), subtitle: s(subtitle) }).prefault({});

/** Setting key: "homepage.text" — every label, heading and button caption that is not part of the
 * larger content blocks above (header, hero extras, section headings, footer CTA, widgets…).
 * Defaults match the original copy, so an empty/missing setting changes nothing. */
export const siteTextSchema = z.object({
  header: z
    .object({
      bookNowLabel: s("Book Now"),
      navSelfDrive: s("Self Drive"),
      navTaxi: s("Taxi"),
      navTours: s("Tours"),
      navBlog: s("Blog"),
      navAbout: s("About"),
      navContact: s("Contact"),
    })
    .prefault({}),
  hero: z
    .object({
      pickupCardTitle: s("Pickup points"),
      pickupCardNote: s("Delivery to Airport, Railway Station or Hotel"),
      /** Stats under the hero headline. `source` picks an automatic number, or "custom" uses `value` as typed. */
      stats: z
        .array(
          z.object({
            source: z.enum(["cars", "cities", "locations", "custom"]).default("custom"),
            value: z.string().default(""),
            label: z.string().min(1),
          }),
        )
        .default([
          { source: "cars", value: "", label: "Cars in fleet" },
          { source: "cities", value: "", label: "Pickup cities" },
          { source: "custom", value: "24/7", label: "Road support" },
        ]),
    })
    .prefault({}),
  philosophy: z
    .object({
      cardEyebrow: s("Heritage & Craftsmanship"),
      cardCities: s("UDAIPUR · NAVSARI · JAIPUR"),
      ctaLabel: s("Explore The Fleet"),
      ctaHref: s("/cars"),
    })
    .prefault({}),
  sections: z
    .object({
      categories: heading("SRM 3D CATEGORIES", "CHOOSE YOUR DRIVE."),
      fleet: heading("Self drive fleet", "Your car. Your journey.", "Pick a ride from the filmstrip — every car is cleaned, insured and ready for delivery."),
      brands: heading("AUTOMOTIVE SELECTION", "FIND YOUR FAVOURITE BRAND.", "From precision engineering to invincible off-roaders, select your preferred badge for the journey."),
      chauffeur: heading("CHAUFFEUR FLEET & TRANSFERS", "ARRIVE IN COMFORT.", "Professional chauffeurs, sparkling clean interiors, and fixed transparent tariffs."),
      tours: heading("CURATED EXPEDITIONS", "GO BEYOND THE DRIVE.", "Handcrafted tours through forts, deserts, and marble palaces, with premium machines and local insider knowledge."),
      testimonials: heading("VERIFIED EXPERIENCES", "DRIVEN BY TRUST.", "Stories from travellers who chose us for the road ahead — verified on Google."),
    })
    .prefault({}),
  categoryCards: z
    .array(
      z.object({
        key: z.enum(["cars", "taxi", "tours"]),
        eyebrow: z.string().default(""),
        title: z.string().min(1),
        href: z.string().min(1),
        ctaLabel: z.string().default("Explore"),
        rating: z.coerce.number().min(0).max(5).default(5),
        reviews: z.string().default(""),
        image: z.string().default(""),
      }),
    )
    .default([
      { key: "cars", eyebrow: "Self Drive Fleet", title: "Self Drive", href: "/cars", ctaLabel: "Explore Fleet", rating: 5, reviews: "340+", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80&auto=format&fit=crop" },
      { key: "taxi", eyebrow: "Executive Travel", title: "Chauffeur Taxi", href: "/car-rental", ctaLabel: "Book Chauffeur", rating: 4.9, reviews: "520+", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop" },
      { key: "tours", eyebrow: "Rajasthan Expeditions", title: "Royal Tours", href: "/tours", ctaLabel: "Explore Curated Tours", rating: 5, reviews: "213", image: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80&auto=format&fit=crop" },
    ]),
  fleet: z
    .object({
      viewAllLabel: s("View all {count} cars in fleet"),
      bookLabel: s("Book this car"),
      startingFromLabel: s("Starting from"),
    })
    .prefault({}),
  footer: z
    .object({
      ctaEyebrow: s("Your keys are waiting"),
      ctaTitle: s("Ready when"),
      ctaHighlight: s("you are"),
      ctaSubtitle: s("Talk to a real person, get a quote in minutes, and hit the road today."),
      callLabel: s("Call"),
      whatsappLabel: s("WhatsApp us"),
      officesTitle: s("Our offices"),
      conciergeTitle: s("Concierge desk"),
      copyright: s("All rights reserved."),
    })
    .prefault({}),
  floatingWhatsApp: z
    .object({
      title: s("Chat with SRM Car Rentals"),
      subtitle: s("Pick your city — we'll connect you to the local team."),
      submitLabel: s("Start WhatsApp chat"),
      successMessage: s("Thanks! We've saved your request. Continue the chat in WhatsApp — we reply fast."),
      interests: z.array(z.string().min(1)).default(["Self-drive car rental", "Chauffeur / Taxi", "Tour package", "Corporate / long-term", "Something else"]),
    })
    .prefault({}),
  bookingWidget: z
    .object({
      selfDriveTab: s("SELF DRIVE"),
      taxiTab: s("TAXI / CHAUFFEUR"),
      hint: s("Instant delivery to Airport, Railway Station or Hotel"),
      searchCarsLabel: s("SEARCH CARS"),
      findTaxiLabel: s("FIND TAXI"),
      selfDriveNotice: s("Pickup and return time must be at least 24 hours apart and maximum 30 days."),
      taxiNotice: s("Flexible hourly packages and outstation taxi routes available across Rajasthan & Gujarat."),
      trust1Title: s("Verified Cars"),
      trust1Detail: s("(100% Insured & Cleaned)"),
      trust2Title: s("Transparent Pricing"),
      trust2Detail: s("(Zero Hidden Extras)"),
      trust3Title: s("24/7 Roadside Support"),
    })
    .prefault({}),
  errors: z
    .object({
      notFoundTitle: s("Wrong turn"),
      notFoundMessage: s("The page you're looking for doesn't exist or has moved. Let's get you back on the road."),
      serverErrorTitle: s("Something went wrong"),
      serverErrorMessage: s("An unexpected error occurred on our side. You can try again, or head back to the homepage."),
    })
    .prefault({}),
});
export type SiteText = z.infer<typeof siteTextSchema>;
export const DEFAULT_SITE_TEXT: SiteText = siteTextSchema.parse({});

export const SITE_CONTENT_SCHEMAS: Record<string, z.ZodType<unknown>> = {
  "homepage.content": homepageContentSchema,
  "homepage.company": companyContentSchema,
  "homepage.text": siteTextSchema,
  "homepage.copy": z.record(z.string(), z.string().max(2000)),
  "pages.about": aboutPageContentSchema,
  "pages.contact": contactPageContentSchema,
  "pages.faq": faqPageContentSchema,
  "pages.terms": termsPageContentSchema,
  "system.services": availableServicesSchema,
};

