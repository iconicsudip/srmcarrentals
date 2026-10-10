import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getPaymentOptions } from "@/lib/payments/options";

/** Public: which payment methods checkout should offer (no credentials). */
export const GET = withErrorHandling(async () => ok(await getPaymentOptions()));
