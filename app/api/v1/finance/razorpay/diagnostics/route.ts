import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import {
  getRazorpayConfig,
  testRazorpayConnection,
} from "@/lib/razorpay/razorpay-service";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("payments.view");
  const config = await getRazorpayConfig();

  const url = new URL(req.url);
  const webhookUrl = `${url.origin}/api/v1/payments/razorpay/webhook`;

  return ok({
    enabled: config.enabled,
    mode: config.mode,
    hasKeyId: Boolean(config.keyId),
    hasKeySecret: Boolean(config.keySecret),
    hasWebhookSecret: Boolean(config.webhookSecret),
    keyIdMasked: config.keyId
      ? `${config.keyId.slice(0, 8)}...${config.keyId.slice(-4)}`
      : null,
    webhookUrl,
  });
});

export const POST = withErrorHandling(async () => {
  await requirePermission("payments.view");
  const result = await testRazorpayConnection();
  return ok(result);
});
