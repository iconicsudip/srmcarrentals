import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getWhatsAppNumbers } from "@/lib/whatsapp/numbers";

/** Public: city → WhatsApp number routing (numbers only, no credentials). */
export const GET = withErrorHandling(async () => ok(await getWhatsAppNumbers()));
