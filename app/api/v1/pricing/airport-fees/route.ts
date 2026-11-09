import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getAirportFees } from "@/modules/pricing/services/airport-fees.service";

/** Public: pickup + drop fee per airport, so the booking panel can show it next to each terminal. */
export const GET = withErrorHandling(async () => ok(await getAirportFees()));
