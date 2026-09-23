import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding locations, airports, insurances, and extra services...");

  // 1. Locations
  const udaipur = await prisma.location.upsert({
    where: { slug: "udaipur-hq" },
    update: {},
    create: {
      name: "Udaipur HQ (University Road)",
      slug: "udaipur-hq",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      latitude: 24.5854,
      longitude: 73.7125,
      status: "ACTIVE",
    },
  });

  const jaipur = await prisma.location.upsert({
    where: { slug: "jaipur-branch" },
    update: {},
    create: {
      name: "Jaipur Branch (Kalwar Road)",
      slug: "jaipur-branch",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      latitude: 26.9124,
      longitude: 75.7873,
      status: "ACTIVE",
    },
  });

  const navsari = await prisma.location.upsert({
    where: { slug: "navsari-branch" },
    update: {},
    create: {
      name: "Navsari Branch (Vijalpore)",
      slug: "navsari-branch",
      city: "Navsari",
      state: "Gujarat",
      country: "India",
      latitude: 20.9467,
      longitude: 72.952,
      status: "ACTIVE",
    },
  });

  console.log("Locations seeded:", [udaipur.name, jaipur.name, navsari.name]);

  // 2. Airports
  const udrAirport = await prisma.airport.upsert({
    where: { code: "UDR" },
    update: {},
    create: {
      name: "Maharana Pratap Airport (UDR)",
      code: "UDR",
      slug: "udr-airport",
      city: "Udaipur",
      state: "Rajasthan",
      country: "India",
      latitude: 24.6177,
      longitude: 73.8961,
      status: "ACTIVE",
    },
  });

  const jaiAirport = await prisma.airport.upsert({
    where: { code: "JAI" },
    update: {},
    create: {
      name: "Jaipur International Airport (JAI)",
      code: "JAI",
      slug: "jai-airport",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
      latitude: 26.8288,
      longitude: 75.8056,
      status: "ACTIVE",
    },
  });

  const stvAirport = await prisma.airport.upsert({
    where: { code: "STV" },
    update: {},
    create: {
      name: "Surat International Airport (STV)",
      code: "STV",
      slug: "stv-airport",
      city: "Navsari / Surat",
      state: "Gujarat",
      country: "India",
      latitude: 21.1139,
      longitude: 72.7419,
      status: "ACTIVE",
    },
  });

  console.log("Airports seeded:", [udrAirport.name, jaiAirport.name, stvAirport.name]);

  // 3. Airport Location Charges
  await prisma.airportLocationCharge.upsert({
    where: {
      airportId_locationId: {
        airportId: udrAirport.id,
        locationId: udaipur.id,
      },
    },
    update: {},
    create: {
      airportId: udrAirport.id,
      locationId: udaipur.id,
      pickupCharge: 500,
      dropCharge: 500,
      roundTripCharge: 900,
    },
  });

  await prisma.airportLocationCharge.upsert({
    where: {
      airportId_locationId: {
        airportId: jaiAirport.id,
        locationId: jaipur.id,
      },
    },
    update: {},
    create: {
      airportId: jaiAirport.id,
      locationId: jaipur.id,
      pickupCharge: 600,
      dropCharge: 600,
      roundTripCharge: 1000,
    },
  });

  // 4. Insurances
  const standardInsurance = await prisma.insurance.upsert({
    where: { id: "ins-standard-001" },
    update: {},
    create: {
      id: "ins-standard-001",
      name: "Standard Comprehensive Cover",
      description: "Includes statutory third-party liability and basic comprehensive damage cover.",
      pricingType: "FIXED",
      fixedPrice: 0,
      status: "ACTIVE",
    },
  });

  const zeroDepInsurance = await prisma.insurance.upsert({
    where: { id: "ins-zerodep-002" },
    update: {},
    create: {
      id: "ins-zerodep-002",
      name: "Zero-Depreciation Damage Waiver (Full Protection)",
      description: "Reduces your financial liability for accidental damage to zero. Travel with 100% peace of mind.",
      pricingType: "DAILY",
      dailyPrice: 399,
      status: "ACTIVE",
    },
  });

  console.log("Insurances seeded:", [standardInsurance.name, zeroDepInsurance.name]);

  // 5. Extra Services
  const extraDriver = await prisma.extraService.upsert({
    where: { id: "srv-driver-001" },
    update: {},
    create: {
      id: "srv-driver-001",
      name: "Additional Driver Authorization",
      description: "Authorizes a secondary verified driver to operate the rental car legally.",
      price: 250,
      pricingType: "PER_BOOKING",
      status: "ACTIVE",
    },
  });

  const fastagPass = await prisma.extraService.upsert({
    where: { id: "srv-fastag-002" },
    update: {},
    create: {
      id: "srv-fastag-002",
      name: "Pre-Loaded FASTag Toll Pass (₹500 Credit)",
      description: "Convenient electronic toll clearance with ₹500 pre-loaded toll balance.",
      price: 500,
      pricingType: "PER_BOOKING",
      status: "ACTIVE",
    },
  });

  const childSeat = await prisma.extraService.upsert({
    where: { id: "srv-childseat-003" },
    update: {},
    create: {
      id: "srv-childseat-003",
      name: "Infant / Child Safety Seat",
      description: "ISOFIX-compatible sanitized safety seat fitted before vehicle handover.",
      price: 199,
      pricingType: "PER_DAY",
      status: "ACTIVE",
    },
  });

  console.log("Extra services seeded:", [extraDriver.name, fastagPass.name, childSeat.name]);
  console.log("Location & Service seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
