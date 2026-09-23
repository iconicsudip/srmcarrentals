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

export const SITE_CONTENT_SCHEMAS: Record<string, z.ZodType<unknown>> = {
  "homepage.content": homepageContentSchema,
  "homepage.company": companyContentSchema,
  "pages.about": aboutPageContentSchema,
  "pages.contact": contactPageContentSchema,
  "pages.faq": faqPageContentSchema,
  "pages.terms": termsPageContentSchema,
};
