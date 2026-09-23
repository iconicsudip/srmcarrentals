import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding car specifications, capacities, safety features, and options...");

  // 1. Car Capacities (with luggageCapacity)
  const capacitiesData = [
    { label: "4 Seater (2 Bags)", luggageCapacity: "2 Bags" },
    { label: "5 Seater (2 Large Bags)", luggageCapacity: "2 Large Bags" },
    { label: "5 Seater (3 Bags)", luggageCapacity: "3 Bags" },
    { label: "7 Seater (3 Large Bags)", luggageCapacity: "3 Large Bags" },
    { label: "7 Seater (4 Large Bags)", luggageCapacity: "4 Large Bags" },
    { label: "8 Seater (4 Bags)", luggageCapacity: "4 Bags" },
  ];

  const capacitiesMap = new Map<string, string>();
  for (const cap of capacitiesData) {
    let existing = await prisma.carCapacity.findFirst({ where: { label: cap.label } });
    if (!existing) {
      existing = await prisma.carCapacity.create({ data: cap });
    }
    capacitiesMap.set(cap.label, existing.id);
  }
  console.log(`✓ Capacities ready: ${capacitiesMap.size}`);

  // 2. Door Options
  const doorData = [
    { count: 3 },
    { count: 4 },
    { count: 5 },
  ];
  const doorsMap = new Map<number, string>();
  for (const d of doorData) {
    let existing = await prisma.carDoorOption.findFirst({ where: { count: d.count } });
    if (!existing) {
      existing = await prisma.carDoorOption.create({ data: { count: d.count } });
    }
    doorsMap.set(d.count, existing.id);
  }
  console.log(`✓ Door options ready: ${doorsMap.size}`);

  // 3. Cylinder Options
  const cylinderData = [
    { count: 3 },
    { count: 4 },
    { count: 6 },
  ];
  const cylindersMap = new Map<number, string>();
  for (const c of cylinderData) {
    let existing = await prisma.carCylinderOption.findFirst({ where: { count: c.count } });
    if (!existing) {
      existing = await prisma.carCylinderOption.create({ data: { count: c.count } });
    }
    cylindersMap.set(c.count, existing.id);
  }
  console.log(`✓ Cylinder options ready: ${cylindersMap.size}`);

  // 4. Steering Types
  const steeringData = [
    { name: "Electric Power Steering" },
    { name: "Hydraulic Power Steering" },
    { name: "Electronic Tilt & Telescopic Steering" },
  ];
  const steeringsMap = new Map<string, string>();
  for (const s of steeringData) {
    let existing = await prisma.steeringType.findFirst({ where: { name: s.name } });
    if (!existing) {
      existing = await prisma.steeringType.create({ data: s });
    }
    steeringsMap.set(s.name, existing.id);
  }
  console.log(`✓ Steering types ready: ${steeringsMap.size}`);

  // 5. Safety Features
  const safetyFeaturesData = [
    { name: "Dual Front Airbags", icon: "Shield" },
    { name: "6 Airbags (Front, Side & Curtain)", icon: "Shield" },
    { name: "ABS with EBD", icon: "Shield" },
    { name: "Electronic Stability Control (ESC)", icon: "Shield" },
    { name: "Hill Hold Assist", icon: "Shield" },
    { name: "Rear Parking Sensors", icon: "Camera" },
    { name: "Reverse Parking Camera", icon: "Camera" },
    { name: "ISOFIX Child Seat Mounts", icon: "Shield" },
    { name: "Speed Sensing Auto Door Lock", icon: "Lock" },
    { name: "Tire Pressure Monitoring System (TPMS)", icon: "Gauge" },
  ];
  const safetyFeaturesMap = new Map<string, string>();
  for (const sf of safetyFeaturesData) {
    let existing = await prisma.safetyFeature.findFirst({ where: { name: sf.name } });
    if (!existing) {
      existing = await prisma.safetyFeature.create({ data: sf });
    }
    safetyFeaturesMap.set(sf.name, existing.id);
  }
  console.log(`✓ Safety features ready: ${safetyFeaturesMap.size}`);

  // 6. Connect options to all cars
  const cars = await prisma.car.findMany({
    include: {
      seatOption: true,
      category: true,
      brand: true,
      features: true,
    },
  });

  const allSafetyIds = Array.from(safetyFeaturesMap.values());
  const basicSafetyIds = [
    safetyFeaturesMap.get("Dual Front Airbags"),
    safetyFeaturesMap.get("ABS with EBD"),
    safetyFeaturesMap.get("Rear Parking Sensors"),
  ].filter(Boolean) as string[];

  const premiumSafetyIds = [
    safetyFeaturesMap.get("6 Airbags (Front, Side & Curtain)"),
    safetyFeaturesMap.get("ABS with EBD"),
    safetyFeaturesMap.get("Electronic Stability Control (ESC)"),
    safetyFeaturesMap.get("Hill Hold Assist"),
    safetyFeaturesMap.get("Reverse Parking Camera"),
    safetyFeaturesMap.get("ISOFIX Child Seat Mounts"),
    safetyFeaturesMap.get("Tire Pressure Monitoring System (TPMS)"),
  ].filter(Boolean) as string[];

  for (const car of cars) {
    const seatCount = car.seatOption?.count ?? 5;
    const is7Seater = seatCount >= 7;
    const isSedan = car.category?.name?.toLowerCase().includes("sedan");
    const isThar3Door = car.name.toLowerCase().includes("thar") && !car.name.toLowerCase().includes("roxx");
    const isAlto = car.name.toLowerCase().includes("alto");
    const isPremium = car.isFeatured || is7Seater || car.name.toLowerCase().includes("safari") || car.name.toLowerCase().includes("verna") || car.name.toLowerCase().includes("innova");

    // Capacity
    let capId = capacitiesMap.get("5 Seater (2 Large Bags)");
    if (is7Seater) {
      capId = capacitiesMap.get(seatCount >= 8 ? "8 Seater (4 Bags)" : "7 Seater (3 Large Bags)");
    } else if (isSedan) {
      capId = capacitiesMap.get("5 Seater (3 Bags)");
    } else if (seatCount === 4) {
      capId = capacitiesMap.get("4 Seater (2 Bags)");
    }

    // Doors
    const doorId = isThar3Door ? doorsMap.get(3) : isSedan ? doorsMap.get(4) : doorsMap.get(5);

    // Cylinders
    const cylId = isAlto ? cylindersMap.get(3) : cylindersMap.get(4);

    // Steering
    const steerId = (car.name.toLowerCase().includes("thar") || car.name.toLowerCase().includes("scorpio"))
      ? steeringsMap.get("Hydraulic Power Steering") ?? steeringsMap.get("Electric Power Steering")
      : steeringsMap.get("Electric Power Steering");

    await prisma.car.update({
      where: { id: car.id },
      data: {
        carCapacityId: capId,
        doorOptionId: doorId,
        cylinderOptionId: cylId,
        steeringTypeId: steerId,
      },
    });

    // Safety features
    const safetyToAssign = isPremium ? premiumSafetyIds : basicSafetyIds;
    await prisma.carSafetyFeatureOnCar.deleteMany({ where: { carId: car.id } });
    if (safetyToAssign.length > 0) {
      await prisma.carSafetyFeatureOnCar.createMany({
        data: safetyToAssign.map((safetyFeatureId) => ({ carId: car.id, safetyFeatureId })),
        skipDuplicates: true,
      });
    }

    // If Innova Crysta had 0 features, add standard features
    if (car.name.toLowerCase().includes("innova") && car.features.length === 0) {
      const standardFeatures = await prisma.carFeature.findMany({ take: 5 });
      if (standardFeatures.length > 0) {
        await prisma.carFeatureOnCar.createMany({
          data: standardFeatures.map((f) => ({ carId: car.id, featureId: f.id })),
          skipDuplicates: true,
        });
      }
    }
  }

  console.log(`✓ Updated all ${cars.length} cars with dynamic admin-managed capacities, doors, cylinders, steering, and safety features!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
