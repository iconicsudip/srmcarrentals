import { resolveDropCharge } from "@/lib/pricing/location-routes";
import { getRouteCharges } from "@/lib/pricing/location-routes.server";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";

/**
 * Resolves and validates pickup/drop locations for a pricing request. Kept
 * as its own service (rather than inlined in the orchestrator) so
 * location-specific pricing rules — e.g. a future inter-city drop surcharge —
 * have a natural home without touching the rest of the pricing engine.
 */
export async function resolveLocations(pickupLocationId?: string, dropLocationId?: string) {
  const [pickupLocation, dropLocation] = await Promise.all([
    pickupLocationId
      ? prisma.location.findUnique({ where: { id: pickupLocationId } })
      : Promise.resolve(null),
    dropLocationId ? prisma.location.findUnique({ where: { id: dropLocationId } }) : Promise.resolve(null),
  ]);

  if (pickupLocationId && !pickupLocation) throw new NotFoundError("Pickup location not found");
  if (dropLocationId && !dropLocation) throw new NotFoundError("Drop location not found");

  // A charge set for this exact pickup → drop pair wins; otherwise the drop location's own charge applies.
  const dropCharge = resolveDropCharge(await getRouteCharges(), pickupLocation?.id, dropLocation);

  return { pickupLocation, dropLocation, dropCharge };
}
