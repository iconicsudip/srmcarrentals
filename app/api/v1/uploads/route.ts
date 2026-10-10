import { requireSession } from "@/lib/auth/session";
import { BadRequestError } from "@/lib/http/errors";
import { created } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { saveImageWithFallback } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]);
const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set(["gallery", "tours", "testimonials", "chauffeur-services", "cms", "misc"]);

/**
 * @swagger
 * /uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Generic admin image upload (multipart/form-data, fields "file" + optional "folder"). Any authenticated admin session may use it.
 *     responses:
 *       201: { description: "{ url }" }
 */
export const POST = withErrorHandling(async (req) => {
  await requireSession();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) throw new BadRequestError("Missing image file");
  if (!ALLOWED_TYPES.has(file.type)) throw new BadRequestError("Unsupported image type");
  if (file.size > MAX_BYTES) throw new BadRequestError("Image exceeds the 15MB upload limit");

  const folderInput = formData.get("folder");
  const folder = typeof folderInput === "string" && ALLOWED_FOLDERS.has(folderInput) ? folderInput : "misc";

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await saveImageWithFallback({ buffer, originalName: file.name, folder });

  return created({ url });
});
