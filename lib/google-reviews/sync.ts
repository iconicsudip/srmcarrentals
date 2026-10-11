import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/modules/settings/settings.service";

const HOST = process.env.RAPIDAPI_GMR_HOST ?? "google-maps-reviews-api.p.rapidapi.com";
const SETTING_KEY = "integrations.google_reviews";
const FEATURE_ID_RE = /0x[0-9a-f]+:0x[0-9a-f]+/i;
const HARD_PAGE_LIMIT = 60; // protects the API quota (10 reviews per request)
const LOCK_MS = 10 * 60_000;
const IST_OFFSET_MS = 5.5 * 3_600_000;

export interface GoogleReviewsConfig {
  sources?: string[];
  state?: {
    lastSyncAt?: string;
    lastResult?: SyncResult;
    runningSince?: string;
    /** Page token to continue importing older reviews on the next full run. */
    backfillToken?: Record<string, string>;
    backfillDone?: Record<string, boolean>;
  };
}

export interface SyncResult {
  mode: "incremental" | "full";
  fetched: number;
  imported: number;
  skippedWithoutText: number;
  requests: number;
  errors: string[];
  at: string;
}

interface GmrReview {
  reviewId?: string;
  rating?: number;
  text?: string | null;
  authorName?: string;
  authorPhoto?: string | null;
}

export async function getGoogleReviewsConfig(): Promise<GoogleReviewsConfig> {
  return (await getSetting<GoogleReviewsConfig>(SETTING_KEY)) ?? {};
}

async function saveConfig(patch: Partial<GoogleReviewsConfig>): Promise<GoogleReviewsConfig> {
  const next = { ...(await getGoogleReviewsConfig()), ...patch };
  await setSetting(SETTING_KEY, next);
  return next;
}

export async function saveSources(sources: string[]) {
  await saveConfig({ sources });
}

async function api(path: string): Promise<Response> {
  const key = process.env.RAPIDAPI_GMR_KEY ?? "";
  return fetch(`https://${HOST}${path}`, {
    headers: { "x-rapidapi-host": HOST, "x-rapidapi-key": key },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
}

/** A source is a Google feature id (0x…:0x…), a Place ID, or any Google Maps link. */
async function resolveFeatureId(source: string): Promise<string> {
  const direct = decodeURIComponent(source).match(FEATURE_ID_RE);
  if (direct) return direct[0];
  const res = await api(`/resolve?input=${encodeURIComponent(source)}`);
  const body = await res.text();
  if (!res.ok) throw new Error(`Could not resolve "${source.slice(0, 60)}": ${body.slice(0, 160)}`);
  const found = decodeURIComponent(body).match(FEATURE_ID_RE);
  if (!found) throw new Error(`No Google place found for "${source.slice(0, 60)}"`);
  return found[0];
}

/**
 * Pulls reviews from the API into `testimonials` (source = "google"). Reviews are keyed by Google's
 * review id, so re-running never duplicates and admin edits to status / order are kept.
 *
 *  - incremental (weekly): newest first; stops at the first page made only of reviews we already have
 *    (usually 1–2 requests).
 *  - full: keeps paging back through history (continues from where the last full run stopped).
 */
export async function syncGoogleReviews(opts: { mode?: "incremental" | "full"; maxPages?: number } = {}): Promise<SyncResult> {
  const mode = opts.mode ?? "incremental";
  const maxPages = Math.min(HARD_PAGE_LIMIT, Math.max(1, opts.maxPages ?? (mode === "full" ? 30 : 8)));
  const key = process.env.RAPIDAPI_GMR_KEY ?? "";
  if (!key) throw new Error("RAPIDAPI_GMR_KEY is not configured on the server");

  const config = await getGoogleReviewsConfig();
  const sources = (config.sources ?? []).filter(Boolean).slice(0, 10);
  if (sources.length === 0) throw new Error("Add at least one Google Maps link or Place ID");

  const result: SyncResult = { mode, fetched: 0, imported: 0, skippedWithoutText: 0, requests: 0, errors: [], at: new Date().toISOString() };
  const backfillToken = { ...(config.state?.backfillToken ?? {}) };
  const backfillDone = { ...(config.state?.backfillDone ?? {}) };

  for (const source of sources) {
    try {
      const featureId = await resolveFeatureId(source);
      let pageToken: string | undefined = mode === "full" ? backfillToken[featureId] : undefined;

      for (let i = 0; i < maxPages; i++) {
        const q: string = `/reviews?lang=en&sortBy=newest&country=in&featureId=${encodeURIComponent(featureId)}${
          pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""
        }`;
        const res = await api(q);
        result.requests++;
        if (!res.ok) {
          result.errors.push(`Reviews request failed (${res.status}) for ${source.slice(0, 50)}`);
          break;
        }
        const json = (await res.json()) as { reviews?: GmrReview[]; nextPageToken?: string };
        const reviews = json.reviews ?? [];
        const ids = reviews.map((r) => r.reviewId).filter((x): x is string => Boolean(x));
        const known = new Set(
          (await prisma.testimonial.findMany({ where: { externalId: { in: ids } }, select: { externalId: true } })).map((t) => t.externalId),
        );

        for (const r of reviews) {
          result.fetched++;
          const text = (r.text ?? "").trim();
          if (!r.reviewId || !text) {
            result.skippedWithoutText++;
            continue;
          }
          const data = {
            customerName: (r.authorName ?? "Google user").slice(0, 120),
            avatarUrl: r.authorPhoto ?? null,
            rating: Math.min(5, Math.max(1, Math.round(r.rating ?? 5))),
            quote: text.length > 1000 ? `${text.slice(0, 997)}…` : text,
          };
          await prisma.testimonial.upsert({
            where: { externalId: r.reviewId },
            create: { ...data, externalId: r.reviewId, location: "Google Review", source: "google", status: "ACTIVE", sortOrder: 0 },
            update: data,
          });
          if (!known.has(r.reviewId)) result.imported++;
        }

        pageToken = json.nextPageToken;
        if (mode === "full") {
          if (pageToken) backfillToken[featureId] = pageToken;
          else {
            delete backfillToken[featureId];
            backfillDone[featureId] = true;
          }
        }
        if (!pageToken || reviews.length === 0) break;
        // Incremental: everything on this page was already stored → nothing newer remains.
        if (mode === "incremental" && ids.length > 0 && ids.every((id) => known.has(id))) break;
      }
    } catch (e) {
      result.errors.push((e as Error).message);
    }
  }

  // A failed run (quota, network…) must not count as "done this week", so it is retried on the next visit.
  await saveConfig({
    state: {
      ...(config.state ?? {}),
      lastSyncAt: result.errors.length === 0 ? result.at : config.state?.lastSyncAt,
      lastResult: result,
      runningSince: undefined,
      backfillToken,
      backfillDone,
    },
  });
  return result;
}

/** Start of the most recent Saturday 00:00 in India time, as a UTC Date. */
export function lastSaturdayStartIST(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const daysSinceSat = (ist.getUTCDay() + 1) % 7; // Sat=0 … Fri=6
  const start = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate() - daysSinceSat);
  return new Date(start - IST_OFFSET_MS);
}

/**
 * Weekly schedule without a cron host: call this from a normal request (non-blocking). If this week's
 * Saturday sync hasn't happened yet, it runs once (guarded by a short lock). Safe to call on every request.
 */
export async function maybeRunWeeklyGoogleReviewsSync(): Promise<void> {
  try {
    if (!process.env.RAPIDAPI_GMR_KEY) return;
    const config = await getGoogleReviewsConfig();
    if (!config.sources?.length) return;
    const last = config.state?.lastSyncAt ? new Date(config.state.lastSyncAt) : null;
    if (last && last >= lastSaturdayStartIST()) return; // already done this week
    // Back off for 6 hours after a failed attempt (e.g. API quota) instead of retrying on every visit
    const lastTry = config.state?.lastResult;
    if (lastTry && lastTry.errors.length > 0 && Date.now() - new Date(lastTry.at).getTime() < 6 * 3_600_000) return;
    const running = config.state?.runningSince ? new Date(config.state.runningSince).getTime() : 0;
    if (Date.now() - running < LOCK_MS) return; // another request is already syncing
    await saveConfig({ state: { ...(config.state ?? {}), runningSince: new Date().toISOString() } });
    await syncGoogleReviews({ mode: "incremental" });
  } catch (e) {
    console.warn("[GoogleReviews] weekly sync failed:", (e as Error).message);
  }
}
