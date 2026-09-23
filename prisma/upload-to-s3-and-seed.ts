import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "srm-rentals-uploads";
const REGION = process.env.AWS_REGION || "ap-south-1";

// Cache for uploaded URLs to avoid re-uploading duplicate images
const s3UrlCache = new Map<string, string>();

async function uploadToS3(sourceUrl: string): Promise<string> {
  if (s3UrlCache.has(sourceUrl)) {
    return s3UrlCache.get(sourceUrl)!;
  }

  try {
    const filename = path.basename(new URL(sourceUrl).pathname);
    const s3Key = `cars/${filename}`;
    const targetUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${s3Key}`;

    // Download image
    const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) {
      console.warn(`Failed to download ${sourceUrl} (${res.status}), keeping original URL`);
      return sourceUrl;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    let contentType = "image/jpeg";
    if (filename.endsWith(".avif")) contentType = "image/avif";
    else if (filename.endsWith(".png")) contentType = "image/png";
    else if (filename.endsWith(".webp")) contentType = "image/webp";

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    console.log(`✓ Uploaded to S3: ${filename} -> ${targetUrl}`);
    s3UrlCache.set(sourceUrl, targetUrl);
    return targetUrl;
  } catch (err) {
    console.error(`Error uploading ${sourceUrl} to S3:`, err);
    return sourceUrl;
  }
}

async function upsertBrand(name: string, slug: string) {
  return prisma.carBrand.upsert({
    where: { slug },
    update: { name, status: "ACTIVE" },
    create: { name, slug, status: "ACTIVE" },
  });
}

async function upsertModel(name: string, slug: string, brandId: string) {
  return prisma.carModel.upsert({
    where: { slug },
    update: { name, brandId, status: "ACTIVE" },
    create: { name, slug, brandId, status: "ACTIVE" },
  });
}

async function upsertCategory(name: string, slug: string) {
  return prisma.carCategory.upsert({
    where: { slug },
    update: { name, status: "ACTIVE" },
    create: { name, slug, status: "ACTIVE" },
  });
}

async function upsertCarType(name: string, slug: string) {
  return prisma.carType.upsert({
    where: { slug },
    update: { name, status: "ACTIVE" },
    create: { name, slug, status: "ACTIVE" },
  });
}

async function main() {
  console.log("🚗 Seeding full fleet with AWS S3 images to Neon DB...\n");

  // ── Brands ────────────────────────────────────────────────────────
  const maruti   = await upsertBrand("Maruti Suzuki", "maruti-suzuki");
  const hyundai  = await upsertBrand("Hyundai", "hyundai");
  const tata     = await upsertBrand("Tata", "tata");
  const mahindra = await upsertBrand("Mahindra", "mahindra");
  const toyota   = await upsertBrand("Toyota", "toyota");
  const kia      = await upsertBrand("Kia", "kia");

  // ── Models ───────────────────────────────────────────────────────
  const altoK10      = await upsertModel("Alto K10", "alto-k10", maruti.id);
  const swiftManual  = await upsertModel("Swift VXI", "swift-vxi", maruti.id);
  const swiftAuto    = await upsertModel("Swift Automatic", "swift-automatic", maruti.id);
  const baleno       = await upsertModel("Baleno", "baleno", maruti.id);
  const dzire        = await upsertModel("Swift Dzire", "swift-dzire", maruti.id);
  const xl6          = await upsertModel("XL6", "xl6", maruti.id);
  const fronx        = await upsertModel("Fronx", "fronx", maruti.id);
  const ertigaManual = await upsertModel("Ertiga", "ertiga", maruti.id);
  const ertigaCng    = await upsertModel("Ertiga CNG", "ertiga-cng", maruti.id);

  const aura         = await upsertModel("Aura", "aura", hyundai.id);
  const verna        = await upsertModel("Verna", "verna", hyundai.id);
  const vernaSunroof = await upsertModel("Verna Sunroof", "verna-sunroof", hyundai.id);
  const vernaD       = await upsertModel("Verna Diesel", "verna-diesel", hyundai.id);
  const alcazar      = await upsertModel("Alcazar", "alcazar", hyundai.id);
  const creta        = await upsertModel("Creta Sunroof", "creta-sunroof", hyundai.id);
  const venue        = await upsertModel("Venue Sunroof", "venue-sunroof", hyundai.id);
  const i20Auto      = await upsertModel("i20 Automatic Sunroof", "i20-automatic-sunroof", hyundai.id);

  const safariAuto   = await upsertModel("Safari Automatic", "safari-automatic", tata.id);
  const safariManual = await upsertModel("Safari", "safari", tata.id);

  const tharRwd      = await upsertModel("Thar RWD", "thar-rwd", mahindra.id);
  const thar4x4      = await upsertModel("Thar 4×4", "thar-4x4", mahindra.id);
  const tharRoxx     = await upsertModel("Thar ROXX", "thar-roxx", mahindra.id);
  const scorpioN     = await upsertModel("Scorpio N", "scorpio-n", mahindra.id);
  const scorpioS11   = await upsertModel("Scorpio S11 Classic", "scorpio-s11-classic", mahindra.id);

  const rumion       = await upsertModel("Rumion", "rumion", toyota.id);
  const carens       = await upsertModel("Carens", "carens", kia.id);
  const seltos       = await upsertModel("Seltos Sunroof", "seltos-sunroof", kia.id);

  // ── Categories ────────────────────────────────────────────────────
  const hatchback   = await upsertCategory("Hatchback", "hatchback");
  const sedan       = await upsertCategory("Sedan", "sedan");
  const suv         = await upsertCategory("SUV", "suv");
  const mpv         = await upsertCategory("MPV", "mpv");
  const compactSuv  = await upsertCategory("Compact SUV", "compact-suv");

  // ── Car Types ────────────────────────────────────────────────────
  const hatchbackType  = await upsertCarType("Hatchback", "hatchback");
  const sedanType      = await upsertCarType("Sedan", "sedan");
  const suvType        = await upsertCarType("SUV", "suv");
  const mpvType        = await upsertCarType("MPV", "mpv");
  const compactSuvType = await upsertCarType("Compact SUV", "compact-suv");

  // ── Transmissions ─────────────────────────────────────────────────
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

  // ── Fuels ─────────────────────────────────────────────────────────
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
  const cng = await prisma.fuelType.upsert({
    where: { id: "srm-fuel-cng" },
    update: { name: "CNG" },
    create: { id: "srm-fuel-cng", name: "CNG" },
  });

  // ── Seats ─────────────────────────────────────────────────────────
  const five  = await prisma.carSeatOption.upsert({ where: { count: 5 }, update: {}, create: { count: 5, label: "5 Seater" } });
  const six   = await prisma.carSeatOption.upsert({ where: { count: 6 }, update: {}, create: { count: 6, label: "6 Seater" } });
  const seven = await prisma.carSeatOption.upsert({ where: { count: 7 }, update: {}, create: { count: 7, label: "7 Seater" } });

  // ── Feature Definitions ───────────────────────────────────────────
  const featureDefs = [
    { name: "Air Conditioning", icon: "AirVent" },
    { name: "Touchscreen Infotainment", icon: "Tv" },
    { name: "Apple CarPlay / Android Auto", icon: "Smartphone" },
    { name: "Bluetooth & USB Audio", icon: "Bluetooth" },
    { name: "Power Steering & Windows", icon: "Zap" },
    { name: "Sunroof", icon: "Sun" },
    { name: "Cruise Control", icon: "Gauge" },
    { name: "360° Camera & Reverse Sensors", icon: "Camera" },
    { name: "Captain Seats", icon: "Armchair" },
    { name: "4×4 / 4WD Capability", icon: "Compass" },
    { name: "GPS Navigation", icon: "Navigation" },
    { name: "Push Button Start / Keyless Entry", icon: "Key" },
  ];

  const featuresMap = new Map<string, string>();
  for (const f of featureDefs) {
    const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const rec = await prisma.carFeature.upsert({
      where: { id: `feat-${slug}` },
      update: { name: f.name, icon: f.icon },
      create: { id: `feat-${slug}`, name: f.name, icon: f.icon },
    });
    featuresMap.set(f.name, rec.id);
  }

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
      rawImages: [`${BASE}/2026/05/Maruti-Suzuki-Alto.avif`],
      featureNames: ["Air Conditioning", "Power Steering & Windows", "Bluetooth & USB Audio"],
    },
    {
      name: "Maruti Swift VXI",
      slug: "maruti-swift-vxi",
      shortDescription: "Sporty hatchback with punchy engine and great mileage.",
      description: "The Maruti Swift VXI is one of India's best-loved hatchbacks. Agile handling, peppy performance, and great fuel economy make it perfect for Udaipur's winding lanes and outstation trips.",
      brand: maruti, model: swiftManual, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 1399, hourlyPrice: 200, includedKmPerDay: 200, extraKmPrice: 11, extraHourPrice: 120,
      rawImages: [`${BASE}/2026/05/Swift-VXI-New.avif`],
      featureNames: ["Air Conditioning", "Power Steering & Windows", "Touchscreen Infotainment", "Bluetooth & USB Audio"],
    },
    {
      name: "Maruti Swift Automatic",
      slug: "maruti-swift-automatic",
      shortDescription: "Effortless automatic driving. Smooth AMT for traffic-free cruising.",
      description: "Enjoy effortless city cruising in the Maruti Swift Automatic. Seamless AMT transmission paired with Maruti's reliable K-Series engine ensures a relaxed driving experience across Rajasthan.",
      brand: maruti, model: swiftAuto, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 1599, hourlyPrice: 220, includedKmPerDay: 200, extraKmPrice: 12, extraHourPrice: 130,
      rawImages: [`${BASE}/2026/05/Swift-Automatic.jpg`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Power Steering & Windows"],
    },
    {
      name: "Maruti Baleno",
      slug: "maruti-baleno",
      shortDescription: "Premium hatchback with spacious cabin and modern features.",
      description: "The Maruti Baleno offers a plush interior, advanced 9-inch infotainment, and remarkable road manners. A great balance of luxury and economy for couples and small families.",
      brand: maruti, model: baleno, year: 2023,
      category: hatchback, carType: hatchbackType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1499, hourlyPrice: 210, includedKmPerDay: 200, extraKmPrice: 11, extraHourPrice: 120,
      rawImages: [`${OLD}/Baleno-self-drive-rental-car-300x300.jpg`, `${OLD}/Maruti-Baleno-rental-car-300x300.jpg`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Power Steering & Windows"],
    },
    {
      name: "Hyundai i20 Automatic Sunroof",
      slug: "hyundai-i20-automatic-sunroof",
      shortDescription: "Sporty premium hatch with electric sunroof and smooth IVT automatic.",
      description: "The Hyundai i20 Auto Sunroof elevates your drive with an open sunroof, digital cockpit, and smooth automatic transmission. Ideal for cruising the lakes of Udaipur and highways beyond.",
      brand: hyundai, model: i20Auto, year: 2024,
      category: hatchback, carType: hatchbackType, transmission: automatic, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 1799, hourlyPrice: 250, includedKmPerDay: 200, extraKmPrice: 12, extraHourPrice: 150,
      rawImages: [`${BASE}/2026/05/i20-Automatic-Sunroof.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Air Conditioning", "Push Button Start / Keyless Entry"],
    },

    // ── Sedans ───────────────────────────────────────────────────────
    {
      name: "Maruti Swift Dzire",
      slug: "maruti-swift-dzire",
      shortDescription: "India's favorite compact sedan. Huge boot space and unmatched fuel economy.",
      description: "The Maruti Dzire combines generous boot space, supreme passenger comfort, and outstanding fuel efficiency. A top choice for business travelers, families, and long-distance road trips.",
      brand: maruti, model: dzire, year: 2023,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1499, hourlyPrice: 210, includedKmPerDay: 200, extraKmPrice: 11, extraHourPrice: 120,
      rawImages: [`${BASE}/2026/05/Swift-Dzire.avif`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Bluetooth & USB Audio", "Power Steering & Windows"],
    },
    {
      name: "Hyundai Aura",
      slug: "hyundai-aura",
      shortDescription: "Stylish compact sedan with refined cabin and smooth ride.",
      description: "The Hyundai Aura delivers contemporary styling, a quiet and well-appointed interior, and smooth road manners. Perfect for airport transfers and regional Rajasthan tours.",
      brand: hyundai, model: aura, year: 2023,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1499, hourlyPrice: 210, includedKmPerDay: 200, extraKmPrice: 11, extraHourPrice: 120,
      rawImages: [`${BASE}/2026/05/Hyundai-Aura.avif`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Bluetooth & USB Audio", "Power Steering & Windows"],
    },
    {
      name: "Hyundai Verna",
      slug: "hyundai-verna",
      shortDescription: "Futuristic mid-size sedan with executive comfort and high-speed stability.",
      description: "The Hyundai Verna brings head-turning futuristic design, premium ventilated seats, and exceptional highway dynamics. Step into true executive luxury.",
      brand: hyundai, model: verna, year: 2024,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 2199, hourlyPrice: 300, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 180,
      rawImages: [`${OLD}/Verna-300x300.jpg`],
      featureNames: ["Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Air Conditioning", "Push Button Start / Keyless Entry", "Cruise Control"],
    },
    {
      name: "Hyundai Verna Sunroof",
      slug: "hyundai-verna-sunroof",
      shortDescription: "Executive sedan with smart electric sunroof and connected car tech.",
      description: "Experience open skies on the highway with the Hyundai Verna Sunroof edition. Loaded with ambient lighting, premium audio, and smooth power delivery.",
      brand: hyundai, model: vernaSunroof, year: 2024,
      category: sedan, carType: sedanType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 2399, hourlyPrice: 320, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 190,
      rawImages: [`${BASE}/2026/05/Verna-Sunroof.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "Air Conditioning"],
    },
    {
      name: "Hyundai Verna Diesel",
      slug: "hyundai-verna-diesel",
      shortDescription: "Torque-rich CRDi diesel engine built for effortless long-distance touring.",
      description: "Powered by Hyundai's acclaimed CRDi diesel powerplant, this Verna delivers unmatched highway torque and phenomenal fuel mileage on marathon Rajasthan road trips.",
      brand: hyundai, model: vernaD, year: 2023,
      category: sedan, carType: sedanType, transmission: manual, fuel: diesel, seats: five,
      isFeatured: false, dailyPrice: 2299, hourlyPrice: 310, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 180,
      rawImages: [`${BASE}/2026/05/Verna-Diesel.avif`],
      featureNames: ["Cruise Control", "Touchscreen Infotainment", "Air Conditioning", "Power Steering & Windows"],
    },

    // ── Compact SUVs ─────────────────────────────────────────────────
    {
      name: "Maruti Fronx",
      slug: "maruti-fronx",
      shortDescription: "Coupe-SUV styling with high ground clearance and agile handling.",
      description: "The Maruti Fronx merges head-turning coupe styling with commanding crossover posture. Ideal for zipping through urban streets and tackling hilly terrain.",
      brand: maruti, model: fronx, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1699, hourlyPrice: 240, includedKmPerDay: 200, extraKmPrice: 12, extraHourPrice: 140,
      rawImages: [`${OLD}/Fronx-car-rental-udaipur-300x300.jpg`, `${OLD}/Maruti-Fronx-Rental-car-300x300.jpg`],
      featureNames: ["Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Air Conditioning", "Power Steering & Windows"],
    },
    {
      name: "Hyundai Venue Sunroof",
      slug: "hyundai-venue-sunroof",
      shortDescription: "Connected compact SUV with smart electric sunroof and bold stance.",
      description: "The Venue Sunroof delivers the complete compact SUV experience. High seating position, easy maneuverability, and an electric sunroof make every drive scenic.",
      brand: hyundai, model: venue, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: false, dailyPrice: 1899, hourlyPrice: 260, includedKmPerDay: 200, extraKmPrice: 13, extraHourPrice: 160,
      rawImages: [`${BASE}/2026/05/Venue-Sunroof.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Air Conditioning"],
    },
    {
      name: "Hyundai Creta Sunroof",
      slug: "hyundai-creta-sunroof",
      shortDescription: "India's #1 mid-size SUV. Panoramic sunroof, commanding stance, and plush cabin.",
      description: "The Hyundai Creta reigns supreme as India's favorite SUV. Featuring a panoramic sunroof, premium upholstery, and robust suspension engineered for any Indian terrain.",
      brand: hyundai, model: creta, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 2499, hourlyPrice: 350, includedKmPerDay: 250, extraKmPrice: 15, extraHourPrice: 200,
      rawImages: [`${BASE}/2026/05/Creta-Sunroof.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "360° Camera & Reverse Sensors"],
    },
    {
      name: "Kia Seltos Sunroof",
      slug: "kia-seltos-sunroof",
      shortDescription: "Aggressive styling, panoramic sunroof, and ultra-modern cockpit.",
      description: "The Kia Seltos turns heads wherever it goes. Packed with dual digital screens, panoramic sunroof, and exhilarating engine response, this SUV redefines self-drive excitement.",
      brand: kia, model: seltos, year: 2024,
      category: compactSuv, carType: compactSuvType, transmission: manual, fuel: petrol, seats: five,
      isFeatured: true, dailyPrice: 2599, hourlyPrice: 360, includedKmPerDay: 250, extraKmPrice: 15, extraHourPrice: 210,
      rawImages: [`${BASE}/2026/05/Kia-Seltos-Sunroof.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "Air Conditioning"],
    },

    // ── MPVs / 6-7 Seaters ──────────────────────────────────────────
    {
      name: "Maruti Ertiga",
      slug: "maruti-ertiga",
      shortDescription: "The ultimate 7-seater family MPV. Comfortable, spacious, and fuel-friendly.",
      description: "The Maruti Ertiga is the undisputed king of Indian family travel. Three rows of comfortable seating, flexible luggage arrangement, and proven Maruti reliability.",
      brand: maruti, model: ertigaManual, year: 2023,
      category: mpv, carType: mpvType, transmission: manual, fuel: petrol, seats: seven,
      isFeatured: true, dailyPrice: 2199, hourlyPrice: 300, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 180,
      rawImages: [`${BASE}/2026/05/Maruti-Ertiga.avif`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Power Steering & Windows", "Bluetooth & USB Audio"],
    },
    {
      name: "Maruti Ertiga CNG",
      slug: "maruti-ertiga-cng",
      shortDescription: "7-seater MPV with factory-fitted S-CNG. Maximum economy for long trips.",
      description: "Save big on fuel without compromising on space. The Ertiga CNG delivers the lowest running cost per kilometer for 7-passenger touring across Rajasthan.",
      brand: maruti, model: ertigaCng, year: 2023,
      category: mpv, carType: mpvType, transmission: manual, fuel: cng, seats: seven,
      isFeatured: false, dailyPrice: 2299, hourlyPrice: 310, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 180,
      rawImages: [`${BASE}/2026/05/Ertiga-CNG.avif`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Power Steering & Windows"],
    },
    {
      name: "Maruti XL6",
      slug: "maruti-xl6",
      shortDescription: "6-seater premium MPV with luxurious second-row Captain Seats.",
      description: "The Maruti XL6 steps up MPV comfort with individual plush captain seats in the second row, all-black leatherette cabin, and cruise control for effortless highway journeys.",
      brand: maruti, model: xl6, year: 2023,
      category: mpv, carType: mpvType, transmission: manual, fuel: petrol, seats: six,
      isFeatured: false, dailyPrice: 2299, hourlyPrice: 310, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 180,
      rawImages: [`${OLD}/Xl6-rental-car-300x300.jpg`],
      featureNames: ["Captain Seats", "Cruise Control", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Air Conditioning"],
    },
    {
      name: "Toyota Rumion",
      slug: "toyota-rumion",
      shortDescription: "Reliable 7-seater MPV powered by Toyota engineering and trust.",
      description: "The Toyota Rumion provides roomy 7-seat comfort with Toyota's legendary peace of mind. Excellent ride comfort for Kumbhalgarh, Mount Abu, and Chittorgarh day trips.",
      brand: toyota, model: rumion, year: 2024,
      category: mpv, carType: mpvType, transmission: manual, fuel: petrol, seats: seven,
      isFeatured: false, dailyPrice: 2399, hourlyPrice: 320, includedKmPerDay: 250, extraKmPrice: 14, extraHourPrice: 190,
      rawImages: [`${BASE}/2026/05/Toyota-Rumion.avif`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Power Steering & Windows"],
    },
    {
      name: "Kia Carens",
      slug: "kia-carens",
      shortDescription: "Futuristic recreational vehicle with 3 rows of luxury and safety.",
      description: "The Kia Carens blends SUV boldness with MPV practicality. One-touch electric tumble seats, 6 airbags standard, and rear AC vents make family travel a joy.",
      brand: kia, model: carens, year: 2024,
      category: mpv, carType: mpvType, transmission: manual, fuel: petrol, seats: seven,
      isFeatured: true, dailyPrice: 2499, hourlyPrice: 340, includedKmPerDay: 250, extraKmPrice: 15, extraHourPrice: 200,
      rawImages: [`${BASE}/2026/05/Kia-Carens.avif`],
      featureNames: ["Air Conditioning", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Push Button Start / Keyless Entry"],
    },
    {
      name: "Hyundai Alcazar",
      slug: "hyundai-alcazar",
      shortDescription: "Premium 7-seater SUV with panoramic sunroof and first-class cabin.",
      description: "The Hyundai Alcazar offers grand presence and executive appointments. Giant panoramic sunroof, wireless charging, and refined CRDi/turbo power for group adventures.",
      brand: hyundai, model: alcazar, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: true, dailyPrice: 2999, hourlyPrice: 420, includedKmPerDay: 250, extraKmPrice: 16, extraHourPrice: 240,
      rawImages: [`${BASE}/2026/05/Hyundai-Alcazar.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "360° Camera & Reverse Sensors"],
    },

    // ── Large SUVs & Off-Roaders ───────────────────────────────────────
    {
      name: "Mahindra Thar RWD",
      slug: "mahindra-thar-rwd",
      shortDescription: "Iconic lifestyle SUV. Hard-top, rear-wheel drive, undeniable road presence.",
      description: "The legendary Mahindra Thar RWD commands every street. Hard-top protection, punchy mStallion/mHawk engine, and iconic rugged looks that make every drive unforgettable.",
      brand: mahindra, model: tharRwd, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 2799, hourlyPrice: 380, includedKmPerDay: 250, extraKmPrice: 16, extraHourPrice: 220,
      rawImages: [`${OLD}/Thar-rental-car-udaipur-300x300.jpg`, `${OLD}/Mahindra-Thar-car-rental-300x300.jpg`],
      featureNames: ["Touchscreen Infotainment", "Air Conditioning", "Bluetooth & USB Audio", "Power Steering & Windows"],
    },
    {
      name: "Mahindra Thar RWD White",
      slug: "mahindra-thar-rwd-white",
      shortDescription: "Stunning White Thar RWD. Perfect for pre-wedding shoots, events, and road trips.",
      description: "Dressed in Everest White, this Mahindra Thar is the top choice for weddings, VIP arrivals, photo shoots, and Rajasthan road tours. Unmatched curb appeal.",
      brand: mahindra, model: tharRwd, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 2899, hourlyPrice: 400, includedKmPerDay: 250, extraKmPrice: 16, extraHourPrice: 230,
      rawImages: [`${BASE}/2026/05/Thar-RWD-White.avif`],
      featureNames: ["Touchscreen Infotainment", "Air Conditioning", "Bluetooth & USB Audio", "Power Steering & Windows"],
    },
    {
      name: "Mahindra Thar 4×4",
      slug: "mahindra-thar-4x4",
      shortDescription: "True go-anywhere 4WD off-roader with low-range transfer case.",
      description: "Conquer sand dunes, rocky hills, and rugged countryside. Shift-on-the-fly 4WD with mechanical locking rear differential for the ultimate off-road experience.",
      brand: mahindra, model: thar4x4, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 3299, hourlyPrice: 450, includedKmPerDay: 250, extraKmPrice: 18, extraHourPrice: 260,
      rawImages: [`${OLD}/Mahindra-Thar-4x4-rental-car-300x300.jpg`],
      featureNames: ["4×4 / 4WD Capability", "Touchscreen Infotainment", "Air Conditioning", "Bluetooth & USB Audio"],
    },
    {
      name: "Mahindra Thar ROXX",
      slug: "mahindra-thar-roxx",
      shortDescription: "The all-new 5-door Thar ROXX. Panoramic sunroof, Harman Kardon audio, luxury off-roader.",
      description: "The pinnacle of Indian SUV engineering. 5-door spaciousness, panoramic sunroof, Level-2 ADAS, Harman Kardon audio, and ferocious mHawk diesel performance.",
      brand: mahindra, model: tharRoxx, year: 2025,
      category: suv, carType: suvType, transmission: automatic, fuel: diesel, seats: five,
      isFeatured: true, dailyPrice: 4499, hourlyPrice: 600, includedKmPerDay: 250, extraKmPrice: 22, extraHourPrice: 350,
      rawImages: [`${BASE}/2026/05/Thar-ROXX.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "360° Camera & Reverse Sensors", "Cruise Control", "Push Button Start / Keyless Entry"],
    },
    {
      name: "Mahindra Scorpio N",
      slug: "mahindra-scorpio-n",
      shortDescription: "The Big Daddy of SUVs. Imposing road presence, 7 seats, and powerful mHawk engine.",
      description: "Mahindra Scorpio N dominates the highway with unmatched muscularity, high driving position, Sony 3D sound, and unstoppable power on Rajasthan expressways.",
      brand: mahindra, model: scorpioN, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: true, dailyPrice: 3199, hourlyPrice: 440, includedKmPerDay: 250, extraKmPrice: 17, extraHourPrice: 250,
      rawImages: [`${BASE}/2026/05/Scorpio-N.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "Air Conditioning"],
    },
    {
      name: "Mahindra Scorpio S11 Classic",
      slug: "mahindra-scorpio-s11-classic",
      shortDescription: "The timeless legend. Raw power, classic silhouette, and rugged durability.",
      description: "The Scorpio Classic S11 retains the beloved aggressive silhouette with modern projector lamps, hydraulic-assisted steering, and brute diesel torque that laughs at bad roads.",
      brand: mahindra, model: scorpioS11, year: 2023,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: false, dailyPrice: 2799, hourlyPrice: 390, includedKmPerDay: 250, extraKmPrice: 16, extraHourPrice: 220,
      rawImages: [`${BASE}/2026/05/Scorpio-S11-Classic.avif`],
      featureNames: ["Touchscreen Infotainment", "Air Conditioning", "Cruise Control", "Power Steering & Windows"],
    },
    {
      name: "Tata Safari",
      slug: "tata-safari",
      shortDescription: "Flagship 7-seater luxury SUV with panoramic sunroof and 5-star safety.",
      description: "The Tata Safari combines Land Rover-derived OMEGARC architecture with top-tier luxury. Boss mode seating, acoustic glass, and sublime ride comfort across any highway.",
      brand: tata, model: safariManual, year: 2024,
      category: suv, carType: suvType, transmission: manual, fuel: diesel, seats: seven,
      isFeatured: true, dailyPrice: 3399, hourlyPrice: 460, includedKmPerDay: 250, extraKmPrice: 18, extraHourPrice: 270,
      rawImages: [`${OLD}/Safari-car-rental-udaipur-300x300.jpg`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "Air Conditioning"],
    },
    {
      name: "Tata Safari Automatic",
      slug: "tata-safari-automatic",
      shortDescription: "Flagship luxury automatic SUV with panoramic sunroof and Terrain Response.",
      description: "Effortless luxury in the Tata Safari Automatic. 6-speed torque converter automatic, panoramic sunroof with mood lighting, ventilated captain seats, and whisper-quiet cruising.",
      brand: tata, model: safariAuto, year: 2024,
      category: suv, carType: suvType, transmission: automatic, fuel: diesel, seats: seven,
      isFeatured: true, dailyPrice: 3699, hourlyPrice: 500, includedKmPerDay: 250, extraKmPrice: 19, extraHourPrice: 300,
      rawImages: [`${BASE}/2026/05/Tata-Safari-Automatic.avif`],
      featureNames: ["Sunroof", "Touchscreen Infotainment", "Apple CarPlay / Android Auto", "Cruise Control", "360° Camera & Reverse Sensors", "Push Button Start / Keyless Entry"],
    },
  ];

  for (const car of cars) {
    console.log(`\nProcessing: ${car.name}...`);

    // Upload raw images to S3
    const s3Images: { url: string; altText: string }[] = [];
    for (const rawUrl of car.rawImages) {
      const s3Url = await uploadToS3(rawUrl);
      s3Images.push({ url: s3Url, altText: `${car.name} rental car` });
    }

    const createdCar = await prisma.car.upsert({
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
      where: { carId: createdCar.id },
      update: {
        dailyPrice: car.dailyPrice,
        hourlyPrice: car.hourlyPrice,
        includedKmPerDay: car.includedKmPerDay,
        extraKmPrice: car.extraKmPrice,
        extraHourPrice: car.extraHourPrice,
      },
      create: {
        carId: createdCar.id,
        dailyPrice: car.dailyPrice,
        hourlyPrice: car.hourlyPrice,
        includedKmPerDay: car.includedKmPerDay,
        extraKmPrice: car.extraKmPrice,
        extraHourPrice: car.extraHourPrice,
      },
    });

    // Images
    await prisma.carImage.deleteMany({ where: { carId: createdCar.id } });
    await prisma.carImage.createMany({
      data: s3Images.map((img, i) => ({
        carId: createdCar.id,
        url: img.url,
        altText: img.altText,
        sortOrder: i,
      })),
    });

    // Features
    await prisma.carFeatureOnCar.deleteMany({ where: { carId: createdCar.id } });
    const featureIdsToAssign = car.featureNames.map((n) => featuresMap.get(n)).filter(Boolean) as string[];
    if (featureIdsToAssign.length > 0) {
      await prisma.carFeatureOnCar.createMany({
        data: featureIdsToAssign.map((featureId) => ({
          carId: createdCar.id,
          featureId,
        })),
        skipDuplicates: true,
      });
    }
  }

  const total = await prisma.car.count({ where: { status: "ACTIVE" } });
  console.log(`\n🎉 Fleet successfully seeded with S3 images to Neon DB! Total active cars: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
