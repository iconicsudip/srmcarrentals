import { PrismaClient, SeoEntityType } from "@prisma/client";

const prisma = new PrismaClient();

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://srmcarrentals.in";

interface DynamicSeoItem {
  path: string;
  entityType?: SeoEntityType;
  entityId?: string;
  carId?: string;
  carCategoryId?: string;
  locationId?: string;
  airportId?: string;
  pageId?: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType?: "website" | "article" | "product";
  schemaType: "AutoRental" | "Product" | "LocalBusiness" | "FAQPage" | "Article" | "Organization";
  aiDirectAnswer: string;
  entityDefinition: string;
  keyTakeaways: string[];
  faqPairs: { question: string; answer: string }[];
  sitemapPriority: number;
  sitemapChangeFreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly";
}

async function upsertSeoItem(item: DynamicSeoItem) {
  const canonicalUrl = `${APP_URL}${item.path === "/" ? "" : item.path}`;
  const settingKey = `seo.page.${encodeURIComponent(item.path)}`;

  const payload = {
    path: item.path,
    entityType: item.entityType || "CUSTOM",
    entityId: item.entityId,
    metaTitle: item.metaTitle,
    metaDescription: item.metaDescription,
    metaKeywords: item.metaKeywords,
    canonicalUrl,
    robotsMeta: "INDEX_FOLLOW",
    ogTitle: item.ogTitle || item.metaTitle,
    ogDescription: item.ogDescription || item.metaDescription,
    ogImage: item.ogImage || "/og-image.jpg",
    ogType: item.ogType || "website",
    twitterCard: "summary_large_image",
    twitterCreator: "@srmcarrentals",
    schemaType: item.schemaType,
    enableStructuredData: true,
    aeoEnabled: true,
    aiDirectAnswer: item.aiDirectAnswer,
    entityDefinition: item.entityDefinition,
    keyTakeaways: item.keyTakeaways,
    faqPairs: item.faqPairs,
    aiBotDirectives: {
      allowGPTBot: true,
      allowPerplexityBot: true,
      allowClaudeBot: true,
      allowGoogleExtended: true,
    },
    inSitemap: true,
    sitemapPriority: item.sitemapPriority,
    sitemapChangeFreq: item.sitemapChangeFreq,
  };

  // 1. Upsert Setting
  await prisma.setting.upsert({
    where: { key: settingKey },
    create: {
      key: settingKey,
      group: "seo.page",
      value: payload as any,
    },
    update: {
      value: payload as any,
    },
  });

  // 2. If entityType is mapped to valid Prisma enum, also sync with seo_metadata table
  const validTypes = Object.values(SeoEntityType) as string[];
  if (item.entityType && validTypes.includes(item.entityType)) {
    const existing = await prisma.seoMetadata.findFirst({
      where: {
        entityType: item.entityType,
        entityId: item.entityId || null,
      },
    });

    const dataPayload = {
      entityType: item.entityType,
      entityId: item.entityId || null,
      metaTitle: item.metaTitle,
      metaDescription: item.metaDescription,
      metaKeywords: item.metaKeywords,
      canonicalUrl,
      robotsMeta: "INDEX_FOLLOW" as const,
      ogTitle: item.ogTitle || item.metaTitle,
      ogDescription: item.ogDescription || item.metaDescription,
      ogImage: item.ogImage || "/og-image.jpg",
      twitterCard: "summary_large_image",
      carId: item.carId,
      carCategoryId: item.carCategoryId,
      locationId: item.locationId,
      airportId: item.airportId,
      pageId: item.pageId,
    };

    if (existing) {
      await prisma.seoMetadata.update({
        where: { id: existing.id },
        data: dataPayload,
      });
    } else {
      await prisma.seoMetadata.create({
        data: dataPayload,
      });
    }
  }
}

export async function seedAllSeo() {
  console.log("🚀 Starting comprehensive SEO & AEO content seeding for all pages...");

  // ─── 1. CORE PAGES ──────────────────────────────────────────────────────────
  const corePages: DynamicSeoItem[] = [
    {
      path: "/",
      entityType: "HOMEPAGE",
      metaTitle: "SRM Car Rentals | Premier Self-Drive & Chauffeur Mobility in Rajasthan",
      metaDescription:
        "Rent luxury sedans, 4x4 SUVs, and chauffeur-driven taxis in Udaipur, Jaipur, and Navsari. Transparent 24h & hourly rates, doorstep handover, and 24/7 road assistance.",
      metaKeywords:
        "self drive car rental udaipur, car hire jaipur, chauffeur taxi rajasthan, thar rental, innova crysta self drive, luxury car rental india",
      ogTitle: "SRM Car Rentals — Your Car, Your Journey",
      ogDescription:
        "Experience self-drive freedom across Rajasthan with 30+ premium verified cars, zero hidden fees, and instant airport terminal handover.",
      ogImage: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "AutoRental",
      aiDirectAnswer:
        "SRM Car Rentals is Rajasthan's leading self-drive and chauffeur mobility provider, offering 30+ vehicles including Mahindra Thar, Innova Crysta, Fortuner, and luxury sedans across Udaipur, Jaipur, and Navsari.",
      entityDefinition:
        "A premium automotive rental platform offering self-drive and chauffeur services with all-India permits, live pricing calculators, and airport terminal dispatch.",
      keyTakeaways: [
        "Fleet of 30+ sanitized, insured vehicles across Hatchbacks, Sedans, 4x4 SUVs, and MPVs.",
        "Doorstep and airport terminal delivery in under 60 minutes across Udaipur & Jaipur.",
        "Transparent billing with flexible 24-hour daily and hourly package options.",
        "Verified professional chauffeurs and 24/7 on-road mechanical support.",
      ],
      faqPairs: [
        {
          question: "What documents are required for renting a self-drive car with SRM?",
          answer:
            "Indian citizens require an original valid driving license and Aadhaar card or passport. International travelers need a valid International Driving Permit (IDP) and passport.",
        },
        {
          question: "Can I take an SRM self-drive car outside Rajasthan?",
          answer:
            "Yes, all SRM self-drive cars have All-India tourist permits. State border taxes and expressway tolls are payable as per actual toll booth receipts.",
        },
        {
          question: "Is airport pickup and drop available?",
          answer:
            "Yes, SRM offers dedicated terminal handover at Udaipur Maharana Pratap Airport (UDR), Jaipur International Airport (JAI), and Surat Airport (STV).",
        },
      ],
      sitemapPriority: 1.0,
      sitemapChangeFreq: "daily",
    },
    {
      path: "/cars",
      metaTitle: "Self Drive Cars Fleet | Rent Thar, Innova, Creta, Safari in Rajasthan",
      metaDescription:
        "Explore SRM's complete self-drive fleet. Filter by SUV, Sedan, MPV, Automatic, or Diesel. Transparent daily rates, unlimited km packages, and instant booking.",
      metaKeywords:
        "self drive fleet rajasthan, rent mahindra thar udaipur, innova crysta rental, automatic car hire jaipur, scorpio rental, budget car rental",
      ogTitle: "Self Drive Car Fleet — Browse All Models | SRM Car Rentals",
      ogDescription:
        "Select from 30+ self-drive cars in Udaipur & Jaipur. From rugged Mahindra Thar 4x4 to family 7-seater Innova Crysta. Real-time availability.",
      ogImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "AutoRental",
      aiDirectAnswer:
        "SRM's self-drive fleet features 30+ modern vehicles ranging from compact city cars like Maruti Fronx to rugged SUVs like Mahindra Thar RWD & 4x4, family MPVs like Innova Crysta, and luxury sedans.",
      entityDefinition:
        "A curated catalog of verified self-drive rental cars equipped with real-time pricing, interactive schedule pickers, and filterable transmission/fuel options.",
      keyTakeaways: [
        "Interactive schedule picker with 24h daily and flexible hourly packages.",
        "Filters for SUV, MPV, Sedan, Hatchback, Automatic, Diesel, and Petrol.",
        "Every vehicle includes comprehensive insurance and 24/7 roadside assistance.",
      ],
      faqPairs: [
        {
          question: "What is the minimum rental duration for self-drive cars?",
          answer: "The minimum rental duration is 24 hours for daily packages or 1 hour for hourly packages.",
        },
        {
          question: "What is the speed limit for self-drive cars?",
          answer: "All self-drive vehicles are capped at a government-mandated safety speed of 80 km/h.",
        },
      ],
      sitemapPriority: 0.95,
      sitemapChangeFreq: "daily",
    },
    {
      path: "/car-rental",
      metaTitle: "Chauffeur Driven Taxi & Outstation Cabs in Udaipur & Jaipur | SRM",
      metaDescription:
        "Book premium chauffeur-driven cabs, luxury airport transfers, outstation sightseeing taxis, and wedding car hire in Rajasthan. Transparent per-km rates with verified drivers.",
      metaKeywords:
        "chauffeur car rental udaipur, outstation taxi jaipur, airport transfer cab rajasthan, luxury wedding car rental, corporate cab service",
      ogTitle: "Chauffeur Taxi & Outstation Travel | SRM Car Rentals",
      ogDescription:
        "Enjoy stress-free executive travel across Rajasthan with trained uniformed chauffeurs, clean air-conditioned cabs, and punctual airport transfers.",
      ogImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "LocalBusiness",
      aiDirectAnswer:
        "SRM Chauffeur Services offers executive sedan and luxury SUV taxi rentals with licensed professional chauffeurs for city travel, Rajasthan outstation tours, and airport pick & drop.",
      entityDefinition:
        "A full-service chauffeur mobility solution offering transparent per-km and flat-rate city/airport taxi services.",
      keyTakeaways: [
        "Uniformed, verified English/Hindi-speaking professional chauffeurs.",
        "Point-to-point airport transfers with flight tracking and meet & greet.",
        "Available for outstation heritage tours to Kumbhalgarh, Mount Abu, Jodhpur, and Jaisalmer.",
      ],
      faqPairs: [
        {
          question: "Are driver charges and fuel included in chauffeur bookings?",
          answer: "Yes, our per-trip packages include driver allowance and fuel. Interstate toll and parking are charged as per actual receipts.",
        },
      ],
      sitemapPriority: 0.9,
      sitemapChangeFreq: "daily",
    },
    {
      path: "/tours",
      metaTitle: "Rajasthan Tour Packages & Guided Expeditions | SRM Car Rentals",
      metaDescription:
        "Experience Royal Rajasthan with curated multi-day tour packages, heritage circuits, desert safaris, and palace excursions paired with private luxury vehicles.",
      metaKeywords:
        "rajasthan tour packages, udaipur sightseeing tour, royal rajasthan circuit, jaisalmer desert tour, luxury car tour rajasthan",
      ogTitle: "Curated Royal Rajasthan Expeditions | SRM Car Rentals",
      ogDescription:
        "Discover fortresses, desert sand dunes, and vibrant heritage with customized Rajasthan tour itineraries and dedicated private cars.",
      ogImage: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "LocalBusiness",
      aiDirectAnswer:
        "SRM Royal Tours provides handcrafted multi-day expeditions across Rajasthan, combining private chauffeur transport with curated heritage palace stays, desert safaris, and sightseeing itineraries.",
      entityDefinition:
        "Curated travel packages combining premium vehicle transport with cultural sightseeing itineraries across Rajasthan.",
      keyTakeaways: [
        "Customizable multi-day itineraries covering Udaipur, Jaipur, Jodhpur, Jaisalmer, and Mount Abu.",
        "Private dedicated vehicle with experienced route chauffeur throughout the journey.",
      ],
      faqPairs: [
        {
          question: "Can I customize the tour itinerary?",
          answer: "Yes, all tour packages can be customized for dates, duration, vehicle preferences, and additional stopovers.",
        },
      ],
      sitemapPriority: 0.85,
      sitemapChangeFreq: "weekly",
    },
    {
      path: "/about-us",
      metaTitle: "About SRM Car Rentals | Trusted Mobility Partner in Rajasthan",
      metaDescription:
        "Learn about SRM Car Rentals' mission, heritage, and values. Delivering top-tier self-drive cars, verified chauffeurs, and 24/7 customer assistance since inception.",
      metaKeywords:
        "about srm car rentals, car hire company udaipur, best self drive rajasthan, trusted car rental partner",
      ogTitle: "About SRM Car Rentals — Drive With Confidence & Freedom",
      ogDescription:
        "Dedicated to making self-drive car hire in India transparent, hassle-free, and luxurious. Over 500+ happy travelers served.",
      ogImage: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "Organization",
      aiDirectAnswer:
        "SRM Car Rentals is an independent premium vehicle rental enterprise headquartered in Udaipur, Rajasthan, providing high-quality self-drive cars and professional chauffeur solutions across western India.",
      entityDefinition: "Corporate profile and operational background of SRM Car Rentals.",
      keyTakeaways: [
        "Headquartered in Udaipur with branch hubs in Jaipur and Navsari.",
        "100% company-owned, meticulously serviced modern vehicle fleet.",
        "Zero hidden fees and transparent refundable security deposit handling.",
      ],
      faqPairs: [
        {
          question: "Where are SRM Car Rentals branches located?",
          answer: "Our branches are located on University Road in Udaipur, Kalwar Road in Jaipur, and Vijalpore in Navsari.",
        },
      ],
      sitemapPriority: 0.7,
      sitemapChangeFreq: "monthly",
    },
    {
      path: "/contact-us",
      metaTitle: "Contact SRM Car Rentals | 24/7 Customer Support & Branch Offices",
      metaDescription:
        "Reach out to SRM Car Rentals for instant bookings, corporate lease queries, and roadside support. Call +91 98765 43210 or visit our Udaipur and Jaipur offices.",
      metaKeywords:
        "contact srm car rentals, car rental helpline udaipur, jaipur car rental phone number, srm office address",
      ogTitle: "Contact Concierge Desk | SRM Car Rentals",
      ogDescription:
        "Need a car right now or have questions about a reservation? Contact our 24/7 concierge team via phone, WhatsApp, or email.",
      ogImage: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "LocalBusiness",
      aiDirectAnswer:
        "You can contact SRM Car Rentals 24/7 by calling or WhatsApping our support desk, emailing support@srmcarrentals.in, or visiting our branches in Udaipur and Jaipur.",
      entityDefinition: "Customer service contact points and branch office directory for SRM Car Rentals.",
      keyTakeaways: [
        "24/7 instant WhatsApp and phone reservation helpline.",
        "Rapid response roadside assistance team across all major Rajasthan national highways.",
      ],
      faqPairs: [
        {
          question: "How quickly can I get a car delivered after booking?",
          answer: "Cars can be delivered to your hotel, residence, or airport terminal in as little as 45–60 minutes.",
        },
      ],
      sitemapPriority: 0.7,
      sitemapChangeFreq: "monthly",
    },
    {
      path: "/faq",
      metaTitle: "Frequently Asked Questions | SRM Car Rentals Rajasthan",
      metaDescription:
        "Find clear answers about self-drive car rentals: required ID documents, refundable security deposits, fuel policies, speed limits, and cancellation terms.",
      metaKeywords:
        "car rental faq, self drive rules rajasthan, security deposit car hire, driving license requirements car rental",
      ogTitle: "Frequently Asked Questions | SRM Car Rentals",
      ogDescription:
        "Everything you need to know before booking your self-drive or chauffeur car with SRM Car Rentals.",
      ogImage: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "FAQPage",
      aiDirectAnswer:
        "SRM's FAQ outlines all rental guidelines including required documentation (ID & driving license), refundable deposit policy (₹3,000–₹5,000 refunded within 24 hours of return), 80 km/h speed limit, and fair fuel policy.",
      entityDefinition: "Comprehensive customer knowledge base covering operational rules and booking procedures.",
      keyTakeaways: [
        "Refundable security deposit is credited back within 24 hours after inspection.",
        "Vehicles are provided with fuel and must be returned at the same level.",
        "Speed limit is governed at 80 km/h in accordance with transport department regulations.",
      ],
      faqPairs: [
        {
          question: "When is the security deposit refunded?",
          answer: "The refundable security deposit is processed and returned via original payment method / UPI within 24 hours of vehicle return.",
        },
        {
          question: "What happens in case of an accident or breakdown?",
          answer: "Contact our 24/7 helpline immediately. All vehicles have comprehensive insurance, and we dispatch breakdown assistance promptly.",
        },
      ],
      sitemapPriority: 0.7,
      sitemapChangeFreq: "weekly",
    },
    {
      path: "/terms-and-conditions",
      metaTitle: "Terms & Conditions | SRM Car Rentals Rental Agreement",
      metaDescription:
        "Review the official rental agreement, driver qualifications, vehicle usage policies, security deposit handling, and liability guidelines for SRM Car Rentals.",
      metaKeywords: "car rental terms and conditions, rental agreement rajasthan, srm car policies",
      ogTitle: "Terms & Conditions — Rental Agreement | SRM Car Rentals",
      ogDescription: "Transparent guidelines ensuring a secure and reliable rental experience for both renter and vehicle.",
      ogImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&q=80&auto=format&fit=crop",
      ogType: "article",
      schemaType: "Article",
      aiDirectAnswer:
        "The SRM Car Rentals Terms & Conditions define renter obligations, age requirement (minimum 21 years), 80 km/h speed limit compliance, and insurance liability.",
      entityDefinition: "Legally binding rental terms and customer obligations agreement.",
      keyTakeaways: [
        "Drivers must be at least 21 years old with minimum 1 year of valid driving experience.",
        "Smoking, unauthorized commercial subleasing, and reckless off-roading in non-4x4 vehicles are strictly prohibited.",
      ],
      faqPairs: [
        {
          question: "Who is allowed to drive the rented vehicle?",
          answer: "Only the verified registered driver who submitted their documentation at the time of booking is authorized to drive.",
        },
      ],
      sitemapPriority: 0.5,
      sitemapChangeFreq: "monthly",
    },
    {
      path: "/privacy-policy",
      metaTitle: "Privacy Policy | SRM Car Rentals",
      metaDescription:
        "Read SRM Car Rentals' commitment to data privacy, customer confidentiality, payment encryption, and identity document protection.",
      metaKeywords: "privacy policy srm car rentals, data protection, secure booking",
      ogTitle: "Privacy Policy | SRM Car Rentals",
      ogDescription: "How we collect, protect, and handle your personal identification and transaction data securely.",
      ogImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&q=80&auto=format&fit=crop",
      ogType: "article",
      schemaType: "Article",
      aiDirectAnswer: "SRM Car Rentals adheres to strict data privacy protocols, encrypting all customer documents and payment records without sharing with unauthorized third parties.",
      entityDefinition: "Data privacy and document handling policy.",
      keyTakeaways: [
        "End-to-end encrypted storage for driving licenses and identity documents.",
        "PCI-DSS compliant payment processing via Razorpay.",
      ],
      faqPairs: [
        {
          question: "Is my personal identification safe?",
          answer: "Yes, all uploaded documents are stored on secure encrypted servers and used solely for legal vehicle rental verification.",
        },
      ],
      sitemapPriority: 0.4,
      sitemapChangeFreq: "yearly",
    },
    {
      path: "/cancellation-policy",
      metaTitle: "Cancellation & Refund Policy | SRM Car Rentals",
      metaDescription:
        "Clear and transparent cancellation slabs for self-drive and chauffeur bookings. Easy refunds and flexible rescheduling options.",
      metaKeywords: "cancellation policy car rental, refund policy srm car rentals, cancel car booking",
      ogTitle: "Cancellation & Refund Policy | SRM Car Rentals",
      ogDescription: "Understand cancellation timeframes, refund percentages, and reservation modification rules.",
      ogImage: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1200&q=80&auto=format&fit=crop",
      ogType: "article",
      schemaType: "Article",
      aiDirectAnswer: "SRM Car Rentals provides transparent tiered cancellation fees: 15% fee >48 hrs before pickup; 30% fee 24–48 hrs; 60% fee 10–24 hrs; 80% fee 2–10 hrs; and 100% within 2 hrs of pickup.",
      entityDefinition: "Booking cancellation fee schedule and refund timeframe policy.",
      keyTakeaways: [
        "Full flexibility to reschedule reservations up to 24 hours prior to departure.",
        "Refunds are credited back to the original source within 3–5 working days.",
      ],
      faqPairs: [
        {
          question: "How do I request a booking cancellation?",
          answer: "You can cancel directly through your reservation confirmation link or by contacting customer support on WhatsApp.",
        },
      ],
      sitemapPriority: 0.5,
      sitemapChangeFreq: "monthly",
    },
    {
      path: "/cart",
      metaTitle: "Your Reservation Cart | SRM Car Rentals",
      metaDescription: "Review your selected self-drive vehicles, chauffeur packages, and insurance options before proceeding to secure checkout.",
      metaKeywords: "car rental cart, booking summary, review reservation",
      ogTitle: "Reservation Cart | SRM Car Rentals",
      ogDescription: "Finalize your trip schedule, delivery location, and protection packages.",
      ogImage: "/og-image.jpg",
      schemaType: "AutoRental",
      aiDirectAnswer: "The reservation cart lets customers review vehicle details, dates, delivery preferences, and insurance coverage prior to checkout.",
      entityDefinition: "Customer booking cart and reservation staging interface.",
      keyTakeaways: ["Review trip details and pricing breakdown before confirming."],
      faqPairs: [],
      sitemapPriority: 0.3,
      sitemapChangeFreq: "monthly",
    },
    {
      path: "/checkout",
      metaTitle: "Secure Booking Checkout | SRM Car Rentals",
      metaDescription: "Complete your car rental reservation with instant confirmation, doorstep delivery options, and flexible payment methods.",
      metaKeywords: "checkout car rental, book car now, secure payment srm",
      ogTitle: "Secure Checkout | SRM Car Rentals",
      ogDescription: "Confirm your self-drive or chauffeur reservation with zero hidden fees.",
      ogImage: "/og-image.jpg",
      schemaType: "AutoRental",
      aiDirectAnswer: "SRM Checkout offers pay-at-pickup (cash/UPI upon vehicle handover) or instant online payment with full SSL encryption.",
      entityDefinition: "Secure reservation confirmation and checkout portal.",
      keyTakeaways: ["Pay at vehicle handover or online via secure gateway."],
      faqPairs: [],
      sitemapPriority: 0.3,
      sitemapChangeFreq: "monthly",
    },
  ];

  for (const page of corePages) {
    await upsertSeoItem(page);
    console.log(`  ✓ Seeded SEO for core page: ${page.path}`);
  }

  // ─── 2. CARS (All Active Fleet Vehicles) ──────────────────────────────────
  const cars = await prisma.car.findMany({
    where: { status: "ACTIVE" },
    include: { category: true, brand: true, carType: true, transmissionType: true, fuelType: true },
  });

  for (const car of cars) {
    const brandName = car.brand?.name || "";
    const categoryName = car.category?.name || "Self Drive";
    const carPath = `/car/${car.slug}`;

    const seoItem: DynamicSeoItem = {
      path: carPath,
      entityType: "CAR",
      entityId: car.id,
      carId: car.id,
      metaTitle: `Rent ${car.name} (${car.year}) Self Drive in Rajasthan | SRM Car Rentals`,
      metaDescription: `Book ${car.name} self-drive car rental in Udaipur & Jaipur. ${car.shortDescription || "Meticulously maintained, fully insured with 24h & hourly packages."} Instant airport delivery.`,
      metaKeywords: `rent ${car.name.toLowerCase()}, ${car.name.toLowerCase()} self drive udaipur, ${car.name.toLowerCase()} rental jaipur, ${brandName.toLowerCase()} car hire, ${categoryName.toLowerCase()} rental rajasthan`,
      ogTitle: `Rent ${car.name} Self Drive — SRM Car Rentals`,
      ogDescription: `Experience the comfort and power of ${car.name}. Available for self-drive across Rajasthan with doorstep delivery and transparent rates.`,
      ogImage: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80&auto=format&fit=crop",
      ogType: "product",
      schemaType: "Product",
      aiDirectAnswer: `The ${car.name} (${car.year}) is a premium ${categoryName} available for self-drive hire from SRM Car Rentals in Udaipur, Jaipur, and Navsari. It features ${car.transmissionType?.name || "Smooth"} transmission, ${car.fuelType?.name || "Fuel-efficient"} engine, and comprehensive tourist permit for all-India travel.`,
      entityDefinition: `Vehicle specifications and rental terms for ${car.name} in SRM's self-drive fleet.`,
      keyTakeaways: [
        `${car.name} in pristine mechanical condition, fully sanitized before handover.`,
        `Includes standard 300 km/day allowance with flexible hourly extensions.`,
        `Doorstep delivery available at hotels, train stations, and airport terminals.`,
      ],
      faqPairs: [
        {
          question: `Can I take the ${car.name} out of Rajasthan?`,
          answer: `Yes, our ${car.name} has All-India commercial tourist permits and can be driven nationwide.`,
        },
        {
          question: `What is the security deposit for ${car.name}?`,
          answer: `A refundable security deposit of ₹3,000–₹5,000 is collected at handover and returned within 24 hours of vehicle return.`,
        },
      ],
      sitemapPriority: 0.8,
      sitemapChangeFreq: "weekly",
    };

    await upsertSeoItem(seoItem);
    console.log(`  ✓ Seeded SEO for car: ${car.name} (${carPath})`);
  }

  // ─── 3. CATEGORIES ────────────────────────────────────────────────────────
  const categories = await prisma.carCategory.findMany({ where: { status: "ACTIVE" } });

  for (const cat of categories) {
    const catPath = `/cars/${cat.slug}`;
    const seoItem: DynamicSeoItem = {
      path: catPath,
      entityType: "CAR_CATEGORY",
      entityId: cat.id,
      carCategoryId: cat.id,
      metaTitle: `${cat.name} Car Rentals in Rajasthan | Self Drive ${cat.name} Fleet | SRM`,
      metaDescription: `Rent top-rated ${cat.name} vehicles for self-drive in Udaipur and Jaipur. Browse certified ${cat.name} models with transparent 24h rates and instant booking.`,
      metaKeywords: `${cat.name.toLowerCase()} car rental rajasthan, rent ${cat.name.toLowerCase()} udaipur, ${cat.name.toLowerCase()} self drive jaipur, best ${cat.name.toLowerCase()} hire`,
      ogTitle: `${cat.name} Self Drive Fleet — SRM Car Rentals`,
      ogDescription: `Find the perfect ${cat.name} for your journey across Rajasthan. Available with daily and hourly packages.`,
      ogImage: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "AutoRental",
      aiDirectAnswer: `SRM Car Rentals offers a comprehensive lineup of ${cat.name} vehicles for self-drive hire in Rajasthan, featuring modern safety equipment, air conditioning, and 24/7 breakdown assistance.`,
      entityDefinition: `Collection of ${cat.name} vehicles available for rent in SRM's fleet.`,
      keyTakeaways: [
        `Broad selection of ${cat.name} vehicles in manual and automatic options.`,
        `Available for instant pickup in Udaipur, Jaipur, and Navsari.`,
      ],
      faqPairs: [
        {
          question: `Why choose a ${cat.name} for Rajasthan travel?`,
          answer: `Our ${cat.name} vehicles offer optimal comfort, fuel economy, and luggage capacity for both city streets and highway cruising.`,
        },
      ],
      sitemapPriority: 0.75,
      sitemapChangeFreq: "weekly",
    };

    await upsertSeoItem(seoItem);
    console.log(`  ✓ Seeded SEO for category: ${cat.name} (${catPath})`);
  }

  // ─── 4. LOCATIONS ─────────────────────────────────────────────────────────
  const locations = await prisma.location.findMany({ where: { status: "ACTIVE" } });

  for (const loc of locations) {
    const locPath = `/car-rental/${loc.slug}`;
    const cityName = loc.city || loc.name;

    const seoItem: DynamicSeoItem = {
      path: locPath,
      entityType: "LOCATION",
      entityId: loc.id,
      locationId: loc.id,
      metaTitle: `Car Rental in ${cityName} | Self Drive & Chauffeur Services — ${loc.name}`,
      metaDescription: `Rent self-drive cars and book chauffeur taxis at SRM Car Rentals ${loc.name}, ${cityName}. Doorstep car delivery, railway station pickup, and airport transfers.`,
      metaKeywords: `car rental in ${cityName.toLowerCase()}, self drive ${cityName.toLowerCase()}, car hire ${loc.slug}, rent a car ${cityName.toLowerCase()}`,
      ogTitle: `Car Rental in ${cityName} — SRM Car Rentals (${loc.name})`,
      ogDescription: `Enjoy affordable and luxury self-drive cars in ${cityName}. Quick documentation, verified cars, and 24/7 service.`,
      ogImage: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "LocalBusiness",
      aiDirectAnswer: `SRM Car Rentals operates a flagship branch at ${loc.name} in ${cityName}, providing convenient car pickups, home deliveries, and airport handovers across the ${cityName} metropolitan area.`,
      entityDefinition: `Local branch office and service zone for SRM Car Rentals in ${cityName}.`,
      keyTakeaways: [
        `Direct vehicle handover at ${loc.name} branch or anywhere in ${cityName}.`,
        `Complimentary car sanitization and brief inspection before handover.`,
      ],
      faqPairs: [
        {
          question: `Can I get a car delivered to my hotel in ${cityName}?`,
          answer: `Yes, we deliver cars directly to any hotel, resort, or homestay across ${cityName} within 60 minutes.`,
        },
      ],
      sitemapPriority: 0.8,
      sitemapChangeFreq: "weekly",
    };

    await upsertSeoItem(seoItem);
    console.log(`  ✓ Seeded SEO for location: ${loc.name} (${locPath})`);
  }

  // ─── 5. AIRPORTS ──────────────────────────────────────────────────────────
  const airports = await prisma.airport.findMany({ where: { status: "ACTIVE" } });

  for (const apt of airports) {
    const aptPath = `/airports/${apt.slug}`;

    const seoItem: DynamicSeoItem = {
      path: aptPath,
      entityType: "AIRPORT",
      entityId: apt.id,
      airportId: apt.id,
      metaTitle: `${apt.name} (${apt.code}) Car Rental & Airport Transfers | SRM`,
      metaDescription: `Direct terminal car rental and chauffeur transfers at ${apt.name} (${apt.code}). Flight meet & greet, zero waiting time, and self-drive handover at arrivals.`,
      metaKeywords: `${apt.name.toLowerCase()} car rental, ${apt.code.toLowerCase()} airport taxi, rent car at ${apt.name.toLowerCase()}, airport pickup ${apt.code.toLowerCase()}`,
      ogTitle: `${apt.name} (${apt.code}) Airport Car Rental | SRM`,
      ogDescription: `Step off your flight and straight into your car. Punctual airport terminal delivery with meet and greet.`,
      ogImage: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80&auto=format&fit=crop",
      ogType: "website",
      schemaType: "LocalBusiness",
      aiDirectAnswer: `SRM Car Rentals provides dedicated airport terminal pickup and drop services at ${apt.name} (${apt.code}). Our representative meets you at the arrivals gate with your inspected self-drive or chauffeur car.`,
      entityDefinition: `Airport transfer and terminal vehicle delivery station at ${apt.name}.`,
      keyTakeaways: [
        `Flight tracking ensures our representative is waiting even if your flight is delayed.`,
        `Paperwork completed on your phone for immediate departure from ${apt.code}.`,
      ],
      faqPairs: [
        {
          question: `How does airport handover work at ${apt.code}?`,
          answer: `Our executive tracks your incoming flight and meets you outside the arrivals hall with the vehicle keys ready.`,
        },
      ],
      sitemapPriority: 0.8,
      sitemapChangeFreq: "weekly",
    };

    await upsertSeoItem(seoItem);
    console.log(`  ✓ Seeded SEO for airport: ${apt.name} (${aptPath})`);
  }

  // ─── 6. TOURS ─────────────────────────────────────────────────────────────
  const tours = await prisma.tour.findMany({ where: { status: "ACTIVE" } });

  for (const tour of tours) {
    const tourPath = `/tours/${tour.slug}`;

    const seoItem: DynamicSeoItem = {
      path: tourPath,
      metaTitle: `${tour.name} | Multi-Day Rajasthan Tour Package — SRM`,
      metaDescription: `Book the ${tour.name} with SRM Car Rentals. ${tour.description || "Includes private luxury transport, heritage sightseeing, and local route expertise."}`,
      metaKeywords: `${tour.name.toLowerCase()}, ${tour.slug.replace(/-/g, " ")}, rajasthan tour package, holiday trip rajasthan`,
      ogTitle: `${tour.name} — Luxury Tour Package`,
      ogDescription: tour.description || `Explore Rajasthan in comfort on the ${tour.name}.`,
      ogImage: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop",
      ogType: "product",
      schemaType: "Product",
      aiDirectAnswer: `The ${tour.name} is a comprehensive tour package offered by SRM Car Rentals spanning ${tour.durationDays} days and ${tour.durationNights} nights, featuring private vehicle transport and heritage destinations.`,
      entityDefinition: `Tour itinerary and travel package details for ${tour.name}.`,
      keyTakeaways: [
        `Duration: ${tour.durationDays} Days / ${tour.durationNights} Nights with dedicated vehicle.`,
        `Key experiences: ${(tour.keyExperiences || []).join(", ") || "Heritage forts, palaces, and desert drives"}.`,
      ],
      faqPairs: [
        {
          question: `What vehicle is assigned for the ${tour.name}?`,
          answer: "We provide executive sedans, Innova Crysta, or luxury SUVs based on group size and preference.",
        },
      ],
      sitemapPriority: 0.8,
      sitemapChangeFreq: "weekly",
    };

    await upsertSeoItem(seoItem);
    console.log(`  ✓ Seeded SEO for tour: ${tour.name} (${tourPath})`);
  }

  console.log("✨ All SEO & AEO metadata successfully seeded for all pages, fleet, categories, locations, airports, and tours!");
}

// Allow direct CLI execution: `npx tsx prisma/seed-seo.ts`
if (require.main === module) {
  seedAllSeo()
    .catch((err) => {
      console.error("Error seeding SEO content:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
