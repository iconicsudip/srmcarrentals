import { requirePermission } from "@/lib/auth/rbac";
import { NotFoundError } from "@/lib/http/errors";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { SITE_CONTENT_SCHEMAS } from "@/modules/settings/site-content.schemas";

type Ctx = { params: Promise<{ key: string }> };

/** "homepage.*" and "pages.*" settings (marketing copy and page content)
 * are safe to expose without auth — everything else stays admin-only. */
function isPublicKey(key: string): boolean {
  return (
    key.startsWith("homepage.") ||
    key.startsWith("pages.") ||
    key.startsWith("checkout.") ||
    key.startsWith("system.checkout") ||
    key === "system.services" ||
    key.startsWith("services.")
  );
}

/**
 * @swagger
 * /settings/{key}:
 *   get:
 *     tags: [Settings]
 *     summary: Read a setting by key ("homepage.*" and "pages.*" keys are public; everything else requires settings.manage)
 *     responses: { 200: { description: The setting value, or null. } }
 *   put:
 *     tags: [Settings]
 *     summary: Create/update a setting by key
 *     responses: { 200: { description: Saved. } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { key } = await params;
  if (!isPublicKey(key)) {
    await requirePermission("settings.manage");
  }
  const value = await getSetting(decodeURIComponent(key));
  if (value === null) throw new NotFoundError("Setting not found");
  return ok(value);
});

export const PUT = withErrorHandling<Ctx>(async (req, { params }) => {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  const isContentKey = decodedKey.startsWith("homepage.") || decodedKey.startsWith("pages.");
  await requirePermission(isContentKey ? "homepage.manage" : "settings.manage");

  const body = await req.json();
  const schema = SITE_CONTENT_SCHEMAS[decodedKey];
  const value = schema ? schema.parse(body) : body;

  return ok(await setSetting(decodedKey, value));
});
