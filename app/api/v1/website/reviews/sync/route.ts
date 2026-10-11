import { requirePermission } from "@/lib/auth/rbac";
import { BadRequestError } from "@/lib/http/errors";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getGoogleReviewsConfig, saveSources, syncGoogleReviews } from "@/lib/google-reviews/sync";

/**
 * POST /api/v1/website/reviews/sync   { sources?: string[], mode?: "incremental" | "full", maxPages?: number }
 * Admin-only manual import. Reviews are stored in the database (the homepage never calls the API);
 * a weekly Saturday refresh also runs automatically.
 */
export const POST = withErrorHandling(async (req) => {
  await requirePermission("testimonials.manage");
  const body = (await req.json().catch(() => ({}))) as { sources?: string[]; mode?: "incremental" | "full"; maxPages?: number };
  if (body.sources) await saveSources(body.sources.map((s) => String(s).trim()).filter(Boolean).slice(0, 10));
  try {
    return ok(await syncGoogleReviews({ mode: body.mode ?? "full", maxPages: body.maxPages }));
  } catch (e) {
    throw new BadRequestError((e as Error).message);
  }
});

/** Saved sources + last sync info for the admin dialog. */
export const GET = withErrorHandling(async () => {
  await requirePermission("testimonials.manage");
  const c = await getGoogleReviewsConfig();
  return ok({ sources: c.sources ?? [], lastSyncAt: c.state?.lastSyncAt ?? null, lastResult: c.state?.lastResult ?? null });
});
