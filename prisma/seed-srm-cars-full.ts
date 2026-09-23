/**
 * seed-srm-cars-full.ts
 * -----------------------------------------------------------------
 * Run with:  cd apps/web && npx tsx prisma/seed-srm-cars-full.ts
 *
 * Seeds ALL real SRM Car Rentals vehicles (20+ cars) with:
 * - Real images from SRM website CDN
 * - Accurate specs (seats, fuel, transmission, category)
 * - Both hourly and daily pricing
 * -----------------------------------------------------------------
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚗  Seeding FULL SRM Car Rentals fleet...\n");

  // ── Brands ────────────────────────────────────────────────────────
  const maruti    = await upsertBrand("Maruti Suzuki", "maruti-suzuki");
  const hyundai   = await upsertBrand("Hyundai", "hyundai");
  const tata      = await upsertBrand("Tata", "tata");
  const mahindra  = await upsertBrand("Mahindra", "mahindra");
  const toyota    = await upsertBrand("Toyota", "toyota");
  const kia       = await upsertBrand("Kia", "kia");

  // ── Models ───────────────────────────────────────────────────────
  const altoK10         = await upsertModel("Alto K10", "alto-k10", maruti.id);
  const swiftManual     = await upsertModel("Swift VXI", "swift-vxi", maruti.id);
  const swiftAuto       = await upsertModel("Swift Automatic", "swift-automatic", maruti.id);
  const baleno          = await upsertModel("Baleno", "baleno", maruti.id);
  const dzire           = await upsertModel("Swift Dzire", "swift-dzire", maruti.id);
  const xl6             = await upsertModel("XL6", "xl6", maruti.id);
  const fronx           = await upsertModel("Fronx", "fronx", maruti.id);
  const ertigaManual    = await upsertModel("Ertiga", "ertiga", maruti.id);
  const ertigaCng       = await upsertModel("Ertiga CNG", "ertiga-cng", maruti.id);

  const aura            = await upsertModel("Aura", "aura", hyundai.id);
  const verna           = await upsertModel("Verna", "verna", hyundai.id);
  const vernaSunroof    = await upsertModel("Verna Sunroof", "verna-sunroof", hyundai.id);
  const vernaD          = await upsertModel("Verna Diesel", "verna-diesel", hyundai.id);
  const alcazar         = await upsertModel("Alcazar", "alcazar", hyundai.id);
  const creta           = await upsertModel("Creta Sunroof", "creta-sunroof", hyundai.id);
  const venue           = await upsertModel("Venue Sunroof", "venue-sunroof", hyundai.id);
  const i20Auto         = await upsertModel("i20 Automatic Sunroof", "i20-automatic-sunroof", hyundai.id);

  const safariAuto      = await upsertModel("Safari Automatic", "safari-automatic", tata.id);
  const safariManual    = await upsertModel("Safari", "safari", tata.id);

  const tharRwd         = await upsertModel("Thar RWD", "thar-rwd", mahindra.id);
  const thar4x4         = await upsertModel("Thar 4×4", "thar-4x4", mahindra.id);
  const tharRoxx        = await upsertModel("Thar ROXX", "thar-roxx", mahindra.id);
  const scorpioN        = await upsertModel("Scorpio N", "scorpio-n", mahindra.id);
  const scorpioS11      = await upsertModel("Scorpio S11 Classic", "scorpio-s11-classic", mahindra.id);

  const rumion          = await upsertModel("Rumion", "rumion", toyota.id);

  const carens          = await upsertModel("Carens", "carens", kia.id);
  const seltos          = await upsertModel("Seltos Sunroof", "seltos-sunroof", kia.id);

  // ── Categories ───────────────────────────────────────────────────
  const hatchback   = await upsertCategory("Hatchback", "hatchback");
  const sedan       = await upsertCategory("Sedan", "sedan");
  const suv         = await upsertCategory("SUV", "suv");
  const mpv         = await upsertCategory("MPV", "mpv");
  const compactSuv  = await upsertCategory("Compact SUV", "compact-suv");

  // ── Car Types ────────────────────────────────────────────────────
  const hatchbackType   = await upsertCarType("Hatchback", "hatchback");
  const sedanType       = await upsertCarType("Sedan", "sedan");
  const suvType         = await upsertCarType("SUV", "suv");
  const mpvType         = await upsertCarType("MPV", "mpv");
  const compactSuvType  = await upsertCarType("Compact SUV", "compact-suv");

  // ── Transmission types ────────────────────────────────────────────
  const manual    = await prisma.transmissionType.upsert({ where: { id: "srm-trans-manual" }, update: { name: "Manual" }, create: { id: "srm-trans-manual", name: "Manual" } });
  const automatic = await prisma.transmissionType.upsert({ where: { id: "seed-transmission-automatic" }, update: { name: "Automatic" }, create: { id: "seed-transmission-automatic", name: "Automatic" } });

  // ── Fuel types ─────────────────────────────────────────────────────
  const petrol  = await prisma.fuelType.upsert({ where: { id: "srm-fuel-petrol" }, update: { name: "Petrol" }, create: { id: "srm-fuel-petrol", name: "Petrol" } });
  const diesel  = await prisma.fuelType.upsert({ where: { id: "seed-fuel-diesel" }, update: { name: "Diesel" }, create: { id: "seed-fuel-diesel", name: "Diesel" } });
  const cng     = await prisma.fuelType.upsert({ where: { id: "srm-fuel-cng" }, update: { name: "CNG" }, create: { id: "srm-fuel-cng", name: "CNG" } });

  // ── Seat Options ──────────────────────────────────────────────────
  const five  = await prisma.carSeatOption.upsert({ where: { count: 5 }, update: {}, create: { count: 5, label: "5 Seater" } });
  const six   = await prisma.carSeatOption.upsert({ where: { count: 6 }, update: {}, create: { count: 6, label: "6 Seater" } });
  const seven = await prisma.carSeatOption.upsert({ where: { count: 7 }, update: {}, create: { count: 7, label: "7 Seater" } });

  // ── Car definitions ───────────────────────────────────────────────
  const BASE = "https://srmcarrentals.com/wp-content/uploads";
  const OLD  = "https://stgfiles.srmcarrentals.com/wp-content/uploads/2025/07";

  const cars = [
    // ── Hatchbacks ──────────────────────────────────────────────────
    {
      name: "Maruti Alto K10",
      slug: "maruti-alto-k10",
      shortDescription: "India's most popular compact hatchback. Perfect for city rides and budget trips.",
      description: "The Maruti Alto K10 is nimble, fuel-efficient, and ideal for navigating city streets and short outstation trips. With excellent mileage and a compact footprint, it's the most affordable self-drive option in Udaipur.",
      brand: maruti, model: altoK10, year: 2023,
      category: hatchback, carType: hatchbackType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 999, hourlyPrice: 150, includedKmPerDay: 150, extraKmPrice: 10, extraHourPrice: 100,
      images: [{ url: `${BASE}/2026/05/Maruti-Suzuki-Alto.avif`, altText: "Maruti Alto K10 rental car" }],
    },
    {
      name: "Maruti Swift VXI",
      slug: "maruti-swift-vxi",
      shortDescription: "Sporty hatchback with punchy engine and great mileage.",
      description: "The Maruti Swift VXI is one of India's best-loved hatchbacks. Agile handling, peppy performance, and great fuel economy make it perfect for Udaipur's winding lanes and outstation trips.",
      brand: maruti, model: swiftManual, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1199, hourlyPrice: 180, includedKmPerDay: 200, extraKmPrice: 12, extraHourPrice: 120,
      images: [{ url: `${BASE}/2026/05/Swift-VXI-New.avif`, altText: "Maruti Swift VXI rental car" }],
    },
    {
      name: "Maruti Swift Automatic",
      slug: "maruti-swift-automatic",
      shortDescription: "Automatic hatchback for effortless city driving — no gear changes.",
      description: "The Swift with AMT automatic transmission is perfect for drivers who want convenience without the bulk of a large SUV. Ideal for Udaipur's busy city traffic.",
      brand: maruti, model: swiftAuto, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1499, hourlyPrice: 220, includedKmPerDay: 200, extraKmPrice: 12, extraHourPrice: 150,
      images: [{ url: `${BASE}/2026/05/Swift-Automatic.jpg`, altText: "Swift Automatic rental car" }],
    },
    {
      name: "Maruti Baleno",
      slug: "maruti-baleno",
      shortDescription: "Premium hatchback with spacious interiors and tech-forward features.",
      description: "The Maruti Baleno offers a premium feel in a compact package. Spacious cabin, 360-degree camera, and heads-up display make every journey comfortable and safe. Available in both manual and automatic.",
      brand: maruti, model: baleno, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 1299, hourlyPrice: 200, includedKmPerDay: 200, extraKmPrice: 12, extraHourPrice: 130,
      images: [
        { url: `${OLD}/Baleno-self-drive-rental-car-300x300.jpg`, altText: "Baleno self-drive rental" },
        { url: `${OLD}/Maruti-Baleno-rental-car-300x300.jpg`, altText: "Maruti Baleno rental car" },
      ],
    },

    // ── Sedans ──────────────────────────────────────────────────────
    {
      name: "Maruti Swift Dzire",
      slug: "maruti-swift-dzire",
      shortDescription: "India's most popular compact sedan. Spacious boot, smooth highway ride.",
      description: "The Swift Dzire is a reliable compact sedan perfect for families and outstation trips. With a generous boot, comfortable rear seating, and fuel-efficient petrol engine, it handles both city and highway with ease.",
      brand: maruti, model: dzire, year: 2024,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 1299, hourlyPrice: 200, includedKmPerDay: 250, extraKmPrice: 12, extraHourPrice: 130,
      images: [
        { url: `${BASE}/2026/05/Swift-Dzire.jpg`, altText: "Swift Dzire rental car" },
        { url: `${OLD}/Swift-Dzire-rental-car-300x300.jpg`, altText: "Swift Dzire rental" },
      ],
    },
    {
      name: "Hyundai Aura",
      slug: "hyundai-aura",
      shortDescription: "Feature-packed compact sedan with refined ride quality.",
      description: "The Hyundai Aura is a stylish compact sedan with wireless phone charging, smooth ride quality, and a well-appointed cabin. A great choice for business trips and comfortable family rides.",
      brand: hyundai, model: aura, year: 2024,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1399, hourlyPrice: 210, includedKmPerDay: 250, extraKmPrice: 13, extraHourPrice: 140,
      images: [
        { url: `${OLD}/Hyundai-Aura-SRM-Car-Rentals-300x300.jpg`, altText: "Hyundai Aura rental car" },
        { url: `${OLD}/Hyundai-Aura-SRM-Car-Rentals-1-300x300.jpg`, altText: "Hyundai Aura SRM" },
      ],
    },
    {
      name: "Hyundai Verna",
      slug: "hyundai-verna",
      shortDescription: "Premium mid-size sedan with 6 airbags and advanced safety.",
      description: "The Hyundai Verna is a sophisticated mid-size sedan featuring a powerful engine and ADAS safety. Perfect for long highway drives from Udaipur to Jaipur or Mumbai.",
      brand: hyundai, model: verna, year: 2024,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 1799, hourlyPrice: 280, includedKmPerDay: 250, extraKmPrice: 15, extraHourPrice: 180,
      images: [
        { url: `${OLD}/Hyundai-Verna-rental-car-300x300.jpg`, altText: "Hyundai Verna rental car" },
        { url: `${BASE}/2025/08/hyundai-verna-right-front-three-quarter7.avif`, altText: "Hyundai Verna" },
      ],
    },
    {
      name: "Hyundai Verna Sunroof",
      slug: "hyundai-verna-sunroof",
      shortDescription: "Premium Verna with panoramic sunroof for an elevated driving experience.",
      description: "Experience the Hyundai Verna with a panoramic sunroof — the ultimate premium sedan for open-sky cruising through Rajasthan's scenic highways. Equipped with ADAS Level 2 safety.",
      brand: hyundai, model: vernaSunroof, year: 2024,
      category: sedan, carType: sedanType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 2199, hourlyPrice: 350, includedKmPerDay: 250, extraKmPrice: 15, extraHourPrice: 220,
      images: [{ url: `${BASE}/2026/05/Verna-Sunroof.webp`, altText: "Hyundai Verna Sunroof rental" }],
    },
    {
      name: "Hyundai Verna Diesel",
      slug: "hyundai-verna-diesel",
      shortDescription: "Diesel Verna for long outstation highway drives with excellent fuel economy.",
      description: "The Hyundai Verna Diesel offers exceptional highway fuel economy, making it ideal for long-distance outstation trips from Udaipur to Jodhpur, Jaipur, or Ahmedabad.",
      brand: hyundai, model: vernaD, year: 2024,
      category: sedan, carType: sedanType, transmission: manual, fuel: diesel, seats: five,
      isFeatured: false, dailyPrice: 1999, hourlyPrice: 320, includedKmPerDay: 300, extraKmPrice: 14, extraHourPrice: 200,
      images: [{ url: `${BASE}/2026/05/Verna-Diesel.avif`, altText: "Hyundai Verna Diesel rental" }],
    },

    // ── MPVs ────────────────────────────────────────────────────────
    {
      name: "Maruti Suzuki XL6",
      slug: "maruti-suzuki-xl6",
      shortDescription: "6-seater premium MPV with captain seats. Ideal for family groups.",
      description: "The Maruti Suzuki XL6 is a premium 6-seater MPV with plush captain seats, automatic transmission, and generous luggage space. Perfect for family outings and group trips around Rajasthan.",
      brand: maruti, model: xl6, year: 2024,
      category: mpv, carType: mpvType, transmission: automatic, fuel: petrol, seats: six,
      isFeatured: true, dailyPrice: 2199, hourlyPrice: 350, includedKmPerDay: 300, extraKmPrice: 15, extraHourPrice: 220,
      images: [
        { url: `${BASE}/2026/05/Maruti-Suzuki-XL6.jpg`, altText: "Maruti XL6 rental car" },
        { url: `${OLD}/Maruti-XL6-rental-car-300x300.jpg`, altText: "Maruti XL6" },
      ],
    },
    {
      name: "Maruti Suzuki Ertiga",
      slug: "maruti-suzuki-ertiga",
      shortDescription: "7-seater MPV — comfortable, spacious, great for family trips.",
      description: "The Maruti Suzuki Ertiga is India's most popular 7-seater MPV. Comfortable third row, foldable seats, and smooth petrol engine make it the go-to choice for families exploring Rajasthan.",
      brand: maruti, model: ertigaManual, year: 2024,
      category: mpv, carType: mpvType, transmission: manual, fuel: petrol, seats: seven,
      isFeatured: false, dailyPrice: 2099, hourlyPrice: 330, includedKmPerDay: 300, extraKmPrice: 14, extraHourPrice: 210,
      images: [{ url: `${OLD}/Maruti-XL6-rental-car-300x300.jpg`, altText: "Maruti Ertiga rental" }],
    },
    {
      name: "Maruti Suzuki Ertiga CNG",
      slug: "maruti-suzuki-ertiga-cng",
      shortDescription: "CNG-powered Ertiga — eco-friendly and budget-friendly 7-seater.",
      description: "The Maruti Suzuki Ertiga CNG combines the spaciousness of a 7-seater with the cost savings of CNG fuel. Perfect for budget-conscious family trips across Rajasthan.",
      brand: maruti, model: ertigaCng, year: 2024,
      category: mpv, carType: mpvType, transmission: manual, fuel: cng, seats: seven,
      isFeatured: false, dailyPrice: 1799, hourlyPrice: 280, includedKmPerDay: 300, extraKmPrice: 12, extraHourPrice: 180,
      images: [{ url: `${BASE}/2026/05/Ertiga-CNG.jpg`, altText: "Ertiga CNG rental" }],
    },
    {
      name: "Toyota Rumion",
      slug: "toyota-rumion",
      shortDescription: "7-seater Toyota MPV with premium comfort and reliability.",
      description: "The Toyota Rumion (rebadged Maruti Suzuki Ertiga) combines Toyota's legendary reliability with a roomy 7-seater cabin. A premium choice for group travel and family road trips.",
      brand: toyota, model: rumion, year: 2024,
      category: mpv, carType: mpvType, transmission: automatic, fuel: petrol, seats: seven,
      isFeatured: false, dailyPrice: 2299, hourlyPrice: 360, includedKmPerDay: 300, extraKmPrice: 16, extraHourPrice: 230,
      images: [{ url: `${BASE}/2026/08/Toyota-Rumion-SRM-Car-Rentals.png`, altText: "Toyota Rumion rental" }],
    },
    {
      name: "Kia Carens",
      slug: "kia-carens",
      shortDescription: "Premium 7-seater MPV with panoramic sunroof and ADAS Level 2.",
      description: "The Kia Carens is a family-friendly, feature-packed 7-seater MPV with a panoramic sunroof, ADAS Level 2 safety, and luxurious captain seat interiors. Perfect for premium group road trips.",
      brand: kia, model: carens, year: 2024,
      category: mpv, carType: mpvType, transmission: automatic, fuel: petrol, seats: seven,
      isFeatured: true, dailyPrice: 2799, hourlyPrice: 440, includedKmPerDay: 300, extraKmPrice: 17, extraHourPrice: 280,
      images: [{ url: `${BASE}/2026/05/kisspng-kia-motors-car-kia-sportage-sport-utility-vehicle-1713921323464-removebg-preview.png`, altText: "Kia Carens rental" }],
    },

    // ── Compact SUVs ────────────────────────────────────────────────
    {
      name: "Maruti Suzuki Fronx",
      slug: "maruti-suzuki-fronx",
      shortDescription: "Stylish compact SUV with turbo engine and connected car features.",
      description: "The Maruti Suzuki Fronx is a trendy compact crossover with a powerful turbo-petrol engine, connected car features, and impressive ground clearance — great for both city roads and hilly terrain.",
      brand: maruti, model: fronx, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1599, hourlyPrice: 250, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 160,
      images: [
        { url: `${BASE}/2026/05/FRONX-PETROL.png`, altText: "Maruti Fronx rental" },
        { url: `${OLD}/Maruti-Suzuki-Fronx-self-drive-rental-car-in-Udaipur-300x300.jpg`, altText: "Fronx self-drive Udaipur" },
      ],
    },
    {
      name: "Hyundai Venue Sunroof",
      slug: "hyundai-venue-sunroof",
      shortDescription: "Compact SUV with sunroof, advanced safety and BlueLink connectivity.",
      description: "The Hyundai Venue Sunroof is a feature-rich compact SUV with a panoramic sunroof, ADAS safety, BlueLink connectivity, and premium interiors — perfect for stylish city drives and weekend getaways.",
      brand: hyundai, model: venue, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1799, hourlyPrice: 280, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 180,
      images: [{ url: `${BASE}/2026/05/Venue-Sunroof.avif`, altText: "Hyundai Venue Sunroof rental" }],
    },
    {
      name: "Hyundai Creta Sunroof",
      slug: "hyundai-creta-sunroof",
      shortDescription: "Premium SUV with panoramic sunroof and ADAS Level 2 safety suite.",
      description: "The Hyundai Creta with panoramic sunroof is a premium compact SUV offering class-leading comfort, advanced safety tech, and a powerful diesel engine — ideal for Rajasthani highway roads.",
      brand: hyundai, model: creta, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: automatic, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 2499, hourlyPrice: 400, includedKmPerDay: 300, extraKmPrice: 16, extraHourPrice: 250,
      images: [{ url: `${BASE}/2026/05/image.png`, altText: "Hyundai Creta Sunroof rental" }],
    },
    {
      name: "Kia Seltos Sunroof",
      slug: "kia-seltos-sunroof",
      shortDescription: "Kia's flagship compact SUV with panoramic sunroof and premium interiors.",
      description: "The Kia Seltos with panoramic sunroof is a head-turner on every road. Powerful engine options, ADAS Level 2, and a luxurious interior make it the premium choice for outstation trips from Udaipur.",
      brand: kia, model: seltos, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 2699, hourlyPrice: 420, includedKmPerDay: 300, extraKmPrice: 17, extraHourPrice: 270,
      images: [{ url: `${BASE}/2026/05/Seltos-Sunroof.jpg`, altText: "Kia Seltos Sunroof rental" }],
    },
    {
      name: "Hyundai i20 Automatic Sunroof",
      slug: "hyundai-i20-automatic-sunroof",
      shortDescription: "Premium hatchback with sunroof, automatic gearbox and sporty looks.",
      description: "The Hyundai i20 Automatic Sunroof combines premium hatchback styling with automatic ease and open-sky sunroof experience. Packed with safety features and connected tech.",
      brand: hyundai, model: i20Auto, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1799, hourlyPrice: 280, includedKmPerDay: 200, extraKmPrice: 14, extraHourPrice: 180,
      images: [{ url: `${BASE}/2026/05/i20-automatic-rental.avif`, altText: "Hyundai i20 Automatic Sunroof rental" }],
    },

    // ── Large SUVs ──────────────────────────────────────────────────
    {
      name: "Hyundai Alcazar",
      slug: "hyundai-alcazar",
      shortDescription: "Premium 7-seater SUV with captain seats, panoramic sunroof and ADAS.",
      description: "The Hyundai Alcazar is a sophisticated 7-seater SUV built for families and business travelers. Panoramic sunroof, ADAS Level 1.5, captain seats in the second row, and a powerful turbo-petrol engine make it one of the finest self-drive SUVs in Udaipur.",
      brand: hyundai, model: alcazar, year: 2024,
      category: suv, carType: suvType, transmission: automatic, fuel: petrol, seats: seven,
      isFeatured: true, dailyPrice: 3299, hourlyPrice: 500, includedKmPerDay: 300, extraKmPrice: 18, extraHourPrice: 330,
      images: [{ url: `${BASE}/2026/08/Hyundai-Alcazar-SRM-Car-Rentals.png`, altText: "Hyundai Alcazar rental Udaipur" }],
    },
    {
      name: "Tata Safari",
      slug: "tata-safari",
      shortDescription: "Flagship 7-seater SUV with panoramic sunroof and premium interiors.",
      description: "The Tata Safari is a bold, full-size SUV with 7 captain seats, a panoramic sunroof, ADAS Level 2, and a powerful diesel engine. Arrive in style on any road across Rajasthan.",
      brand: tata, model: safariManual, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: true, dailyPrice: 3499, hourlyPrice: 500, includedKmPerDay: 300, extraKmPrice: 18, extraHourPrice: 350,
      images: [
        { url: `${OLD}/Tata-Safari-SUV-rental-300x300.jpg`, altText: "Tata Safari SUV rental" },
        { url: `${BASE}/2025/07/safari-facelift-exterior-right-front-three-quarter-39.avif`, altText: "Tata Safari" },
      ],
    },
    {
      name: "Tata Safari Automatic",
      slug: "tata-safari-automatic",
      shortDescription: "Automatic Tata Safari — all the luxury, none of the gear changes.",
      description: "The Tata Safari Automatic combines the spacious luxury of the Safari with the convenience of an automatic transmission — perfect for relaxed highway cruising and city trips.",
      brand: tata, model: safariAuto, year: 2024,
      category: suv, carType: suvType, transmission: automatic, fuel: diesel, seats: seven,
      isFeatured: false, dailyPrice: 3999, hourlyPrice: 600, includedKmPerDay: 300, extraKmPrice: 18, extraHourPrice: 400,
      images: [{ url: `${BASE}/2026/05/Safari-Automatic.avif`, altText: "Tata Safari Automatic rental" }],
    },

    // ── Mahindra ────────────────────────────────────────────────────
    {
      name: "Mahindra Thar RWD White",
      slug: "mahindra-thar-rwd-white",
      shortDescription: "Iconic lifestyle SUV in Everest White. Off-road ready, city capable.",
      description: "The Mahindra Thar RWD in Everest White is India's most iconic lifestyle SUV. With its rugged off-road capability, soft-top freedom, and street presence, it's perfect for adventures around Udaipur's hills and deserts.",
      brand: mahindra, model: tharRwd, year: 2024,
      category: suv, carType: suvType, transmission: automatic, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 3999, hourlyPrice: 600, includedKmPerDay: 200, extraKmPrice: 20, extraHourPrice: 400,
      images: [
        { url: `${BASE}/2025/07/mahindra-TharRWD_NewColour_EverestWhite-2.avif`, altText: "Mahindra Thar RWD White" },
        { url: `${BASE}/2025/07/2021-Mahindra-Thar-Hard-Top-1200x724-1.jpg`, altText: "Mahindra Thar" },
      ],
    },
    {
      name: "Mahindra Thar ROXX",
      slug: "mahindra-thar-roxx",
      shortDescription: "The Thar ROXX — 5-door lifestyle SUV with premium interiors.",
      description: "The Mahindra Thar ROXX is the 5-door evolution of the iconic Thar — combining off-road prowess with premium cabin comfort, making it perfect for both adventure seekers and style-conscious travelers.",
      brand: mahindra, model: tharRoxx, year: 2024,
      category: suv, carType: suvType, transmission: automatic, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 4499, hourlyPrice: 700, includedKmPerDay: 250, extraKmPrice: 20, extraHourPrice: 450,
      images: [
        { url: `${BASE}/2026/05/Thar-ROXX.avif`, altText: "Thar ROXX rental" },
        { url: `${BASE}/2025/07/mahindra-thar-roxx-ax7-l-diesel-mt-2wd1724144549335.avif`, altText: "Mahindra Thar ROXX" },
      ],
    },
    {
      name: "Mahindra Scorpio N",
      slug: "mahindra-scorpio-n",
      shortDescription: "Next-gen Scorpio with powerful diesel engine and 6 airbags.",
      description: "The Mahindra Scorpio N is a commanding full-size SUV with a powerful diesel engine, 6 airbags, and rugged all-terrain capability. Built for both city roads and Rajasthani desert terrain.",
      brand: mahindra, model: scorpioN, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: true, dailyPrice: 3799, hourlyPrice: 580, includedKmPerDay: 300, extraKmPrice: 18, extraHourPrice: 380,
      images: [
        { url: `${BASE}/2026/05/Scorpio-N.avif`, altText: "Mahindra Scorpio N rental" },
        { url: `${BASE}/2025/07/Mahindra_Scorpio_N_1662098067527.webp`, altText: "Scorpio N" },
      ],
    },
    {
      name: "Mahindra Scorpio S11 Classic",
      slug: "mahindra-scorpio-s11-classic",
      shortDescription: "Classic Scorpio with 9 seats and proven highway performance.",
      description: "The Mahindra Scorpio S11 Classic is a battle-tested SUV with 9-seater capacity, powerful diesel engine, and commanding road presence — ideal for large family outstation trips across Rajasthan.",
      brand: mahindra, model: scorpioS11, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: false, dailyPrice: 3299, hourlyPrice: 500, includedKmPerDay: 300, extraKmPrice: 17, extraHourPrice: 330,
      images: [{ url: `${BASE}/2026/05/Scorpio-S11-Classic.jpg`, altText: "Scorpio S11 Classic rental" }],
    },
  ];

  // ── Upsert all cars ───────────────────────────────────────────────
  let added = 0, updated = 0;

  for (const [idx, car] of cars.entries()) {
    const existing = await prisma.car.findUnique({ where: { slug: car.slug } });

    const upserted = await prisma.car.upsert({
      where: { slug: car.slug },
      update: {
        name: car.name,
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
      where: { carId: upserted.id },
      update: {
        dailyPrice: car.dailyPrice,
        hourlyPrice: car.hourlyPrice,
        includedKmPerDay: car.includedKmPerDay,
        extraKmPrice: car.extraKmPrice,
        extraHourPrice: car.extraHourPrice,
        minHourlyBookingHours: 1,
      },
      create: {
        carId: upserted.id,
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

    // Images — always recreate for freshness
    await prisma.carImage.deleteMany({ where: { carId: upserted.id } });
    for (const [imgIdx, img] of car.images.entries()) {
      await prisma.carImage.create({
        data: { carId: upserted.id, url: img.url, altText: img.altText, sortOrder: imgIdx },
      });
    }

    const tag = existing ? "↻ updated" : "✅ added";
    if (existing) updated++; else added++;
    console.log(`  ${tag}  [${idx + 1}/${cars.length}] ${car.name} — ₹${car.dailyPrice}/day | ₹${car.hourlyPrice}/hr`);
  }

  console.log(`\n🎉  Done! ${added} cars added, ${updated} cars updated.\n`);
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

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
