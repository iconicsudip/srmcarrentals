import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, RoleName } from "@srm/types";

const prisma = new PrismaClient();

/** Which permission keys each seeded role starts with. SUPER_ADMIN and ADMIN
 * get every permission (SUPER_ADMIN also bypasses checks entirely via
 * lib/auth/rbac.ts); the rest get a sensible operational subset. Admins can
 * still edit any role's permission set later from Settings > Roles. */
const ROLE_DEFAULTS: Record<RoleName, { label: string; isSystem: boolean; permissions: readonly string[] | "*" }> = {
  [RoleName.SUPER_ADMIN]: { label: "Super Admin", isSystem: true, permissions: "*" },
  [RoleName.ADMIN]: { label: "Admin", isSystem: true, permissions: "*" },
  [RoleName.BOOKING_MANAGER]: {
    label: "Booking Manager",
    isSystem: true,
    permissions: [
      "dashboard.view",
      "cars.view",
      "bookings.view",
      "bookings.create",
      "bookings.update",
      "bookings.cancel",
      "bookings.assign_driver",
      "customers.view",
      "customers.manage",
      "drivers.view",
      "drivers.manage",
      "payments.view",
      "invoices.view",
      "coupons.manage",
    ],
  },
  [RoleName.STAFF]: {
    label: "Staff",
    isSystem: true,
    permissions: ["dashboard.view", "cars.view", "bookings.view", "customers.view", "drivers.view"],
  },
  [RoleName.DRIVER]: { label: "Driver", isSystem: true, permissions: [] },
  [RoleName.CUSTOMER]: { label: "Customer", isSystem: true, permissions: [] },
};

function permissionGroup(key: string): string {
  return key.split(".")[0] ?? "general";
}

async function main() {
  console.log("Seeding permissions...");
  const permissionRecords = await Promise.all(
    PERMISSIONS.map((key) =>
      prisma.permission.upsert({
        where: { key },
        update: {},
        create: { key, group: permissionGroup(key) },
      }),
    ),
  );

  console.log("Seeding roles...");
  for (const [name, def] of Object.entries(ROLE_DEFAULTS) as [RoleName, (typeof ROLE_DEFAULTS)[RoleName]][]) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: def.label, isSystem: def.isSystem },
      create: { name, label: def.label, isSystem: def.isSystem },
    });

    const grantedPermissionIds =
      def.permissions === "*"
        ? permissionRecords.map((p) => p.id)
        : permissionRecords.filter((p) => (def.permissions as readonly string[]).includes(p.key)).map((p) => p.id);

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    if (grantedPermissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: grantedPermissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
        skipDuplicates: true,
      });
    }
  }

  console.log("Seeding super admin user...");
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: RoleName.SUPER_ADMIN } });

  const seedEmail = process.env.ADMIN_EMAIL ?? process.env.SEED_SUPER_ADMIN_EMAIL ?? "admin@srmcarrentals.com";
  const seedPassword = process.env.ADMIN_PASSWORD ?? process.env.SEED_SUPER_ADMIN_PASSWORD ?? "AdminPassword123!";
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  await prisma.user.upsert({
    where: { email: seedEmail },
    update: {
      passwordHash,
      isActive: true,
      roleId: superAdminRole.id,
    },
    create: {
      email: seedEmail,
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      roleId: superAdminRole.id,
    },
  });

  console.log(`\nSuper admin ready:\n  email:    ${seedEmail}\n  password: ${seedPassword}\n  (change this immediately after first login)\n`);

  console.log("Seeding default tax...");
  await prisma.tax.upsert({
    where: { id: "default-gst" },
    update: {},
    create: { id: "default-gst", name: "GST", percentage: 18, isDefault: true },
  });

  console.log("Seeding homepage content (editable from Admin > Settings > Homepage Content)...");
  await prisma.setting.upsert({
    where: { key: "homepage.content" },
    update: {},
    create: {
      key: "homepage.content",
      group: "homepage",
      value: {
        hero: {
          badge: "SRM CAR RENTALS · SELF DRIVE & CHAUFFEUR",
          title: "DRIVE YOUR WAY.",
          highlightWord: "WAY",
          subtitle:
            "Premium self-drive cars, chauffeur-driven taxis and unforgettable tours. Transparent pricing, instant confirmation, zero hidden charges.",
          primaryCtaLabel: "Book a Car",
          primaryCtaHref: "/cars",
          secondaryCtaLabel: "Explore Fleet",
          secondaryCtaHref: "/cars",
          backgroundImageUrl: "",
        },
        trustBadges: [
          { icon: "ShieldCheck", label: "Sanitised & Insured" },
          { icon: "Zap", label: "Instant Confirmation" },
          { icon: "BadgeCheck", label: "Zero Hidden Charges" },
        ],
        philosophy: {
          badge: "THE SRM PHILOSOPHY",
          title: "MORE THAN A CAR RENTAL.",
          paragraph1:
            "SRM Car Rentals reimagines private mobility with a passion for fine automotive engineering and genuine hospitality. We believe the vehicle you choose defines how you remember the road.",
          paragraph2:
            "We provide immaculate self-drive machines, vetted chauffeur services, and curated tour itineraries — transparent terms and uncompromising safety on every key handover.",
          imageUrl: "",
          stats: [
            { value: "10+", label: "Years of Excellence" },
            { value: "1,000+", label: "Happy Travellers" },
            { value: "50+", label: "Fleet Machines" },
            { value: "24/7", label: "Concierge Helpline" },
          ],
        },
        whyChooseUs: {
          badge: "THE SRM ADVANTAGE",
          title: "WHY DRIVE WITH SRM?",
          subtitle: "From the moment you inspect the keys to the final drop-off, experience unmatched standards.",
          items: [
            { icon: "ShieldCheck", title: "Premium Fleet", description: "Immaculately maintained, sanitised vehicles ready for every journey." },
            { icon: "Tag", title: "Transparent Pricing", description: "Clear upfront tariffs with zero hidden charges or surprise fees." },
            { icon: "Zap", title: "Easy Booking", description: "Book in minutes with instant digital confirmation." },
            { icon: "Headphones", title: "24/7 Roadside Support", description: "Round-the-clock concierge and breakdown assistance." },
            { icon: "Layers", title: "Flexible Travel Options", description: "Self-drive freedom, chauffeur comfort, or curated tours — you choose." },
            { icon: "Sparkles", title: "Trusted Reliability", description: "Backed by years of service to travellers and businesses alike." },
          ],
        },
        b2b: {
          badge: "ENTERPRISE & INSTITUTIONAL PARTNERSHIPS",
          title: "BUILT FOR BUSINESS.",
          subtitle: "Reliable mobility solutions for hotels, corporates, travel agencies, and businesses.",
          ctaLabel: "Partner With SRM",
          ctaHref: "/contact-us",
          items: [
            { icon: "Building2", title: "Hotels & Resorts", description: "Dedicated fleet partnerships and reliable airport shuttles for guests." },
            { icon: "Briefcase", title: "Corporate Travel", description: "Executive rentals, automated invoicing, and corporate compliance." },
            { icon: "PartyPopper", title: "Weddings & Events", description: "Coordinated luxury convoys and multi-day guest logistics." },
            { icon: "MapPinned", title: "Travel Agencies", description: "B2B net rates and white-labeled chauffeur service." },
            { icon: "Layers", title: "Long-Term Fleet Leases", description: "Flexible subscriptions without capital expenditure." },
          ],
        },
        videoShowcase: {
          badge: "CINEMATIC SHOWCASE",
          title: "THE ROAD IS YOURS.",
          subtitle: "Open highways, serene curves, and urban skylines — engineered to be commanded by you.",
          videoUrl: "",
        },
      },
    },
  });

  await prisma.setting.upsert({
    where: { key: "homepage.company" },
    update: {},
    create: {
      key: "homepage.company",
      group: "homepage",
      value: {
        name: "SRM Car Rentals",
        tagline: "Self Drive & Chauffeur",
        description:
          "Premier self-drive and chauffeur-driven mobility company. High-performance fleet, white-glove chauffeur service, and curated tour expeditions.",
        phone: "+91 00000 00000",
        email: "contact@srmcarrentals.com",
        address: "Update this address from Admin > Settings > Homepage Content",
        socialLinks: { instagram: "", facebook: "", youtube: "", whatsapp: "" },
        footerLinks: {
          services: [
            { label: "Self Drive Cars", href: "/cars" },
            { label: "Taxi & Chauffeur", href: "/car-rental" },
            { label: "Tours", href: "/tours" },
            { label: "Airport Transfers", href: "/airport-transfer" },
          ],
          carsAndBrands: [],
          company: [
            { label: "About SRM", href: "/about-us" },
            { label: "Contact Us", href: "/contact-us" },
            { label: "Terms & Conditions", href: "/terms-and-conditions" },
            { label: "Privacy Policy", href: "/privacy-policy" },
          ],
        },
      },
    },
  });

  console.log("Seeding tour categories...");
  const heritage = await prisma.tourCategory.upsert({
    where: { slug: "rajasthan-heritage" },
    update: {},
    create: { name: "Rajasthan Heritage", slug: "rajasthan-heritage" },
  });

  console.log("Seeding a sample tour (edit or delete from Admin > CMS & SEO > Tours)...");
  await prisma.tour.upsert({
    where: { slug: "royal-rajasthan-heritage-circuit" },
    update: {},
    create: {
      name: "Royal Rajasthan Heritage Circuit",
      slug: "royal-rajasthan-heritage-circuit",
      categoryId: heritage.id,
      rating: 4.9,
      durationDays: 5,
      durationNights: 4,
      description: "Immerse yourself in grand palaces, historic hill-forts, desert highways, and unforgettable sunsets.",
      keyExperiences: ["Fort private access", "Palace visit", "Desert sand dunes camp", "Folk dance & dining"],
      startingPrice: 18999,
      status: "ACTIVE",
    },
  });

  console.log("Seeding sample chauffeur services (edit from Admin > CMS & SEO > Chauffeur Services)...");
  await prisma.chauffeurService.upsert({
    where: { slug: "executive-sedan" },
    update: {},
    create: {
      name: "Executive Sedan",
      slug: "executive-sedan",
      category: "Sedan",
      idealFor: "City tours, airport runs, short trips",
      capacityLabel: "Up to 4 Passengers · 2 Bags",
      features: ["AC Climate Control", "Chauffeur in Uniform", "Toll & Tax Assistance"],
      pricePerKm: 12,
      startingPrice: 1299,
      pricingUnit: "PER_TRIP",
      sortOrder: 1,
    },
  });
  await prisma.chauffeurService.upsert({
    where: { slug: "luxury-suv" },
    update: {},
    create: {
      name: "Luxury SUV",
      slug: "luxury-suv",
      category: "SUV",
      idealFor: "Outstation trips, family travel",
      capacityLabel: "Up to 6-7 Passengers · 4 Bags",
      features: ["Captain Seat Recline", "Roof Air Ducts", "Highway Speed Compliance"],
      pricePerKm: 16,
      startingPrice: 2499,
      pricingUnit: "PER_TRIP",
      sortOrder: 2,
    },
  });

  console.log("Seeding a sample car (edit or delete from Admin > Car Rental > All Car Rental)...");
  const toyota = await prisma.carBrand.upsert({
    where: { slug: "toyota" },
    update: {},
    create: { name: "Toyota", slug: "toyota" },
  });
  const innova = await prisma.carModel.upsert({
    where: { slug: "innova-crysta" },
    update: {},
    create: { name: "Innova Crysta", slug: "innova-crysta", brandId: toyota.id },
  });
  const suvCategory = await prisma.carCategory.upsert({
    where: { slug: "suv" },
    update: {},
    create: { name: "SUV", slug: "suv" },
  });
  const suvType = await prisma.carType.upsert({
    where: { slug: "suv" },
    update: {},
    create: { name: "SUV", slug: "suv" },
  });
  const automatic = await prisma.transmissionType.upsert({
    where: { id: "seed-transmission-automatic" },
    update: {},
    create: { id: "seed-transmission-automatic", name: "Automatic" },
  });
  const diesel = await prisma.fuelType.upsert({
    where: { id: "seed-fuel-diesel" },
    update: {},
    create: { id: "seed-fuel-diesel", name: "Diesel" },
  });
  const sevenSeater = await prisma.carSeatOption.upsert({
    where: { count: 7 },
    update: {},
    create: { count: 7, label: "7 Seater" },
  });

  const sampleCar = await prisma.car.upsert({
    where: { slug: "toyota-innova-crysta" },
    update: {},
    create: {
      name: "Toyota Innova Crysta",
      slug: "toyota-innova-crysta",
      shortDescription: "Spacious, reliable SUV — perfect for families and outstation trips.",
      brandId: toyota.id,
      modelId: innova.id,
      year: new Date().getFullYear(),
      categoryId: suvCategory.id,
      carTypeId: suvType.id,
      transmissionTypeId: automatic.id,
      fuelTypeId: diesel.id,
      seatOptionId: sevenSeater.id,
      status: "ACTIVE",
      isFeatured: true,
    },
  });
  await prisma.carPricing.upsert({
    where: { carId: sampleCar.id },
    update: {},
    create: {
      carId: sampleCar.id,
      dailyPrice: 5000,
      includedKmPerDay: 300,
      extraKmPrice: 15,
      extraHourPrice: 250,
      gracePeriodMinutes: 30,
      extraHourRoundingMode: "ROUND_UP",
    },
  });

  console.log("Seeding default informational pages (edit from Admin > CMS & SEO > Pages)...");
  const defaultPages: { slug: string; title: string; content: string }[] = [
    {
      slug: "about-us",
      title: "About Us",
      content:
        "Welcome to SRM Car Rentals — edit this page from Admin > CMS & SEO > Pages to tell your story.\n\nDescribe your company's history, mission, and what makes your fleet and service different.",
    },
    {
      slug: "contact-us",
      title: "Contact Us",
      content:
        "Get in touch with us using the phone number and email configured in Admin > Website Content > Homepage Content > Company & Footer.\n\nEdit this page to add a contact form, office hours, or directions.",
    },
    {
      slug: "faq",
      title: "Frequently Asked Questions",
      content:
        "Add your most common customer questions and answers here — e.g. what documents are required, fuel policy, security deposits, and late return charges.",
    },
    {
      slug: "terms-and-conditions",
      title: "Terms & Conditions",
      content: "Replace this placeholder with your company's actual rental terms and conditions before going live.",
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      content: "Replace this placeholder with your company's actual privacy policy before going live.",
    },
    {
      slug: "cancellation-policy",
      title: "Cancellation Policy",
      content: "Describe your cancellation and refund policy here — e.g. free cancellation window, partial refunds, and no-show charges.",
    },
  ];

  for (const p of defaultPages) {
    await prisma.page.upsert({
      where: { slug: p.slug },
      update: {},
      create: { slug: p.slug, title: p.title, content: p.content, status: "PUBLISHED" },
    });
  }

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
