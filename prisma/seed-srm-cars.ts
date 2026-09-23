/**
 * seed-srm-cars.ts
 * -----------------------------------------------------------------
 * Run with:  npx ts-node --esm prisma/seed-srm-cars.ts
 * Or via:   npx tsx prisma/seed-srm-cars.ts
 *
 * Adds all 10 real SRM Car Rentals vehicles with accurate specs,
 * pricing (both hourly and daily), and real car images from the
 * SRM website CDN.
 * -----------------------------------------------------------------
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚗  Seeding SRM Car Rentals fleet...\n");

  // ── Shared lookup tables ──────────────────────────────────────────

  // Brands
  const maruti = await upsertBrand("Maruti Suzuki", "maruti-suzuki");
  const hyundai = await upsertBrand("Hyundai", "hyundai");
  const tata = await upsertBrand("Tata", "tata");

  // Models
  const altoK10 = await upsertModel("Alto K10", "alto-k10", maruti.id);
  const swiftManual = await upsertModel("Swift", "swift", maruti.id);
  const swiftAuto = await upsertModel("Swift (Automatic)", "swift-automatic", maruti.id);
  const baleno = await upsertModel("Baleno", "baleno", maruti.id);
  const dzire = await upsertModel("Swift Dzire", "swift-dzire", maruti.id);
  const xl6 = await upsertModel("XL6", "xl6", maruti.id);
  const fronx = await upsertModel("Fronx", "fronx", maruti.id);
  const aura = await upsertModel("Aura", "aura", hyundai.id);
  const verna = await upsertModel("Verna", "verna", hyundai.id);
  const safari = await upsertModel("Safari", "safari", tata.id);

  // Categories
  const hatchback = await upsertCategory("Hatchback", "hatchback");
  const sedan = await upsertCategory("Sedan", "sedan");
  const suv = await upsertCategory("SUV", "suv");
  const mpv = await upsertCategory("MPV", "mpv");
  const compactSuv = await upsertCategory("Compact SUV", "compact-suv");

  // Car types
  const hatchbackType = await upsertCarType("Hatchback", "hatchback");
  const sedanType = await upsertCarType("Sedan", "sedan");
  const suvType = await upsertCarType("SUV", "suv");
  const mpvType = await upsertCarType("MPV", "mpv");
  const compactSuvType = await upsertCarType("Compact SUV", "compact-suv");

  // Transmission types
  const manual = await prisma.transmissionType.upsert({
    where: { id: "srm-trans-manual" },
    update: { name: "Manual" },
    create: { id: "srm-trans-manual", name: "Manual" },
  });
  const automatic = await prisma.transmissionType.upsert({
    where: { id: "seed-transmission-automatic" },
    update: { name: "Automatic" },
    create: { id: "seed-transmission-automatic", name: "Automatic" },
  });

  // Fuel types
  const petrol = await prisma.fuelType.upsert({
    where: { id: "srm-fuel-petrol" },
    update: { name: "Petrol" },
    create: { id: "srm-fuel-petrol", name: "Petrol" },
  });
  const diesel = await prisma.fuelType.upsert({
    where: { id: "seed-fuel-diesel" },
    update: { name: "Diesel" },
    create: { id: "seed-fuel-diesel", name: "Diesel" },
  });

  // Seat options
  const fiveSeat = await prisma.carSeatOption.upsert({ where: { count: 5 }, update: {}, create: { count: 5, label: "5 Seater" } });
  const sixSeat = await prisma.carSeatOption.upsert({ where: { count: 6 }, update: {}, create: { count: 6, label: "6 Seater" } });
  const sevenSeat = await prisma.carSeatOption.upsert({ where: { count: 7 }, update: {}, create: { count: 7, label: "7 Seater" } });

  // ── Car definitions ───────────────────────────────────────────────
  const cars = [
    {
      name: "Maruti Alto K10",
      slug: "maruti-alto-k10",
      shortDescription: "India's most popular compact car. Perfect for city rides, budget trips, and quick getaways.",
      description:
        "The Maruti Alto K10 is a nimble, fuel-efficient hatchback that's ideal for navigating city streets and short outstation trips. With its compact size and excellent mileage, it's the most affordable self-drive option in Udaipur.",
      brand: maruti,
      model: altoK10,
      year: 2023,
      category: hatchback,
      carType: hatchbackType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: false,
      dailyPrice: 999,
      hourlyPrice: 150,
      includedKmPerDay: 150,
      extraKmPrice: 10,
      extraHourPrice: 100,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Alto-K10-rental-car-300x300.jpg",
          altText: "Alto K10 rental car",
        },
      ],
    },
    {
      name: "Maruti Swift",
      slug: "maruti-swift",
      shortDescription: "Sporty, fuel-efficient hatchback. Great for city drives and short trips.",
      description:
        "The Maruti Swift is one of India's best-loved hatchbacks. Agile handling, peppy performance, and great fuel economy make it perfect for Udaipur's winding lanes and outstation trips alike.",
      brand: maruti,
      model: swiftManual,
      year: 2023,
      category: hatchback,
      carType: hatchbackType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: false,
      dailyPrice: 1199,
      hourlyPrice: 180,
      includedKmPerDay: 200,
      extraKmPrice: 12,
      extraHourPrice: 120,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Swift-automatic-rental-car-300x300.jpg",
          altText: "Swift rental car",
        },
      ],
    },
    {
      name: "Maruti Swift Automatic",
      slug: "maruti-swift-automatic",
      shortDescription: "Automatic transmission for effortless city driving. No gear changes, all comfort.",
      description:
        "The Swift with AMT automatic transmission is perfect for drivers who want the convenience of auto gear-shifting without the bulk of a large SUV. Ideal for Udaipur's city traffic.",
      brand: maruti,
      model: swiftAuto,
      year: 2023,
      category: hatchback,
      carType: hatchbackType,
      transmission: automatic,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: false,
      dailyPrice: 1499,
      hourlyPrice: 220,
      includedKmPerDay: 200,
      extraKmPrice: 12,
      extraHourPrice: 150,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Swift-automatic-rental-car-300x300.jpg",
          altText: "Swift automatic rental car",
        },
      ],
    },
    {
      name: "Maruti Baleno",
      slug: "maruti-baleno",
      shortDescription: "Premium hatchback with spacious interiors and tech-forward features.",
      description:
        "The Maruti Baleno offers a premium feel in a compact package. Spacious cabin, 360-degree camera, and heads-up display make every journey comfortable and safe.",
      brand: maruti,
      model: baleno,
      year: 2023,
      category: hatchback,
      carType: hatchbackType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: true,
      dailyPrice: 1299,
      hourlyPrice: 200,
      includedKmPerDay: 200,
      extraKmPrice: 12,
      extraHourPrice: 130,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Baleno-self-drive-rental-car-300x300.jpg",
          altText: "Baleno self-drive rental car",
        },
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Maruti-Baleno-rental-car-300x300.jpg",
          altText: "Maruti Baleno rental car",
        },
      ],
    },
    {
      name: "Maruti Swift Dzire",
      slug: "maruti-swift-dzire",
      shortDescription: "Comfortable sedan for outstation trips. Excellent boot space and smooth highway ride.",
      description:
        "The Swift Dzire is India's most popular compact sedan. With a spacious boot, comfortable rear seating, and smooth petrol engine, it's perfect for families and outstation road trips from Udaipur.",
      brand: maruti,
      model: dzire,
      year: 2023,
      category: sedan,
      carType: sedanType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: true,
      dailyPrice: 1299,
      hourlyPrice: 200,
      includedKmPerDay: 250,
      extraKmPrice: 12,
      extraHourPrice: 130,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Swift-Dzire-rental-car-300x300.jpg",
          altText: "Swift Dzire rental car",
        },
      ],
    },
    {
      name: "Hyundai Aura",
      slug: "hyundai-aura",
      shortDescription: "Feature-packed sedan with a refined ride. Great for business and leisure.",
      description:
        "The Hyundai Aura is a stylish compact sedan with a well-equipped cabin, wireless phone charging, and smooth ride quality. A great choice for business trips and comfortable family rides.",
      brand: hyundai,
      model: aura,
      year: 2023,
      category: sedan,
      carType: sedanType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: false,
      dailyPrice: 1399,
      hourlyPrice: 210,
      includedKmPerDay: 250,
      extraKmPrice: 13,
      extraHourPrice: 140,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Hyundai-Aura-SRM-Car-Rentals-300x300.jpg",
          altText: "Hyundai Aura self-drive rental car",
        },
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Hyundai-Aura-SRM-Car-Rentals-1-300x300.jpg",
          altText: "Hyundai Aura SRM Car Rentals",
        },
      ],
    },
    {
      name: "Hyundai Verna",
      slug: "hyundai-verna",
      shortDescription: "Premium mid-size sedan with panoramic sunroof and 6 airbags.",
      description:
        "The Hyundai Verna is a sophisticated mid-size sedan featuring a panoramic sunroof, ADAS safety suite, and a powerful engine. Perfect for long highway drives from Udaipur to Jaipur or Mumbai.",
      brand: hyundai,
      model: verna,
      year: 2023,
      category: sedan,
      carType: sedanType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: true,
      dailyPrice: 1799,
      hourlyPrice: 280,
      includedKmPerDay: 250,
      extraKmPrice: 15,
      extraHourPrice: 180,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Hyundai-Verna-rental-car-300x300.jpg",
          altText: "Hyundai Verna rental car",
        },
      ],
    },
    {
      name: "Maruti Suzuki XL6",
      slug: "maruti-suzuki-xl6",
      shortDescription: "6-seater MPV with captain seats and spacious third row. Ideal for groups.",
      description:
        "The Maruti Suzuki XL6 is a premium 6-seater MPV with plush captain seats in the middle row, automatic transmission, and generous space for luggage. Perfect for family outings and group trips around Rajasthan.",
      brand: maruti,
      model: xl6,
      year: 2023,
      category: mpv,
      carType: mpvType,
      transmission: automatic,
      fuel: petrol,
      seats: sixSeat,
      isFeatured: true,
      dailyPrice: 2199,
      hourlyPrice: 350,
      includedKmPerDay: 300,
      extraKmPrice: 15,
      extraHourPrice: 220,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Maruti-XL6-rental-car-300x300.jpg",
          altText: "Maruti XL6 rental car",
        },
      ],
    },
    {
      name: "Maruti Suzuki Fronx",
      slug: "maruti-suzuki-fronx",
      shortDescription: "Stylish compact SUV with turbo-petrol engine and connected car tech.",
      description:
        "The Maruti Suzuki Fronx is a trendy compact crossover SUV with a powerful turbo-petrol engine, connected car features, and impressive ground clearance. Great for both city drives and hilly Rajasthani terrain.",
      brand: maruti,
      model: fronx,
      year: 2023,
      category: compactSuv,
      carType: compactSuvType,
      transmission: manual,
      fuel: petrol,
      seats: fiveSeat,
      isFeatured: false,
      dailyPrice: 1599,
      hourlyPrice: 250,
      includedKmPerDay: 250,
      extraKmPrice: 14,
      extraHourPrice: 160,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Maruti-Suzuki-Fronx-self-drive-rental-car-in-Udaipur-300x300.jpg",
          altText: "Maruti Suzuki Fronx self-drive rental car in Udaipur",
        },
      ],
    },
    {
      name: "Tata Safari",
      slug: "tata-safari",
      shortDescription: "Flagship 7-seater SUV with panoramic sunroof and premium interiors.",
      description:
        "The Tata Safari is a bold, full-size SUV with 7 captain seats, a panoramic sunroof, ADAS Level 2, and a powerful diesel engine. For those who want to arrive in style on roads across Rajasthan.",
      brand: tata,
      model: safari,
      year: 2023,
      category: suv,
      carType: suvType,
      transmission: manual,
      fuel: diesel,
      seats: sevenSeat,
      isFeatured: true,
      dailyPrice: 3499,
      hourlyPrice: 500,
      includedKmPerDay: 300,
      extraKmPrice: 18,
      extraHourPrice: 350,
      images: [
        {
          url: "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07/Tata-Safari-SUV-rental-300x300.jpg",
          altText: "Tata Safari SUV rental",
        },
      ],
    },
  ];

  // ── Upsert all cars ───────────────────────────────────────────────
  for (const [idx, car] of cars.entries()) {
    const created = await prisma.car.upsert({
      where: { slug: car.slug },
      update: {
        name: car.name,
        shortDescription: car.shortDescription,
        description: car.description,
        isFeatured: car.isFeatured,
        status: "ACTIVE",
      },
      create: {
        name: car.name,
        slug: car.slug,
        shortDescription: car.shortDescription,
        description: car.description,
        brandId: car.brand.id,
        modelId: car.model.id,
        year: car.year,
        categoryId: car.category.id,
        carTypeId: car.carType.id,
        transmissionTypeId: car.transmission.id,
        fuelTypeId: car.fuel.id,
        seatOptionId: car.seats.id,
        isFeatured: car.isFeatured,
        status: "ACTIVE",
      },
    });

    // Pricing
    await prisma.carPricing.upsert({
      where: { carId: created.id },
      update: {
        dailyPrice: car.dailyPrice,
        hourlyPrice: car.hourlyPrice,
        includedKmPerDay: car.includedKmPerDay,
        extraKmPrice: car.extraKmPrice,
        extraHourPrice: car.extraHourPrice,
        minHourlyBookingHours: 1,
      },
      create: {
        carId: created.id,
        dailyPrice: car.dailyPrice,
        hourlyPrice: car.hourlyPrice,
        includedKmPerDay: car.includedKmPerDay,
        extraKmPrice: car.extraKmPrice,
        extraHourPrice: car.extraHourPrice,
        minHourlyBookingHours: 1,
        gracePeriodMinutes: 30,
        extraHourRoundingMode: "ROUND_UP",
      },
    });

    // Images — delete old and recreate for simplicity
    await prisma.carImage.deleteMany({ where: { carId: created.id } });
    for (const [imgIdx, img] of car.images.entries()) {
      await prisma.carImage.create({
        data: { carId: created.id, url: img.url, altText: img.altText, sortOrder: imgIdx },
      });
    }

    console.log(`  ✅  [${idx + 1}/${cars.length}] ${car.name} — ₹${car.dailyPrice}/day | ₹${car.hourlyPrice}/hr`);
  }

  console.log("\n🎉  Fleet seeded successfully!\n");
}

// ── Helpers ────────────────────────────────────────────────────────

async function upsertBrand(name: string, slug: string) {
  return prisma.carBrand.upsert({ where: { slug }, update: { name }, create: { name, slug } });
}

async function upsertModel(name: string, slug: string, brandId: string) {
  return prisma.carModel.upsert({ where: { slug }, update: { name }, create: { name, slug, brandId } });
}

async function upsertCategory(name: string, slug: string) {
  return prisma.carCategory.upsert({ where: { slug }, update: { name }, create: { name, slug } });
}

async function upsertCarType(name: string, slug: string) {
  return prisma.carType.upsert({ where: { slug }, update: { name }, create: { name, slug } });
}

// ── Run ────────────────────────────────────────────────────────────

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
