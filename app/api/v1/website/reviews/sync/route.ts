import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/rbac";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { prisma } from "@/lib/prisma";

const RAPIDAPI_HOST = process.env.RAPIDAPI_REVIEWS_HOST ?? "google-map-reviews.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.RAPIDAPI_REVIEWS_KEY ?? "";
const SEARCH_ID = process.env.RAPIDAPI_REVIEWS_SEARCH_ID ?? "";

interface RapidApiReview {
  id?: string;
  reviewId?: string;
  name?: string;
  user?: { name?: string; avatar?: string; localGuideLevel?: number };
  rating?: number;
  text?: string;
  snippet?: string;
  date?: string;
  relativeDate?: string;
  profilePhoto?: string;
  isLocalGuide?: boolean;
}

interface RapidApiResponse {
  reviews?: RapidApiReview[];
  data?: { reviews?: RapidApiReview[] };
}

function extractReviews(body: RapidApiResponse): RapidApiReview[] {
  // Handle both response shapes the API may return
  if (Array.isArray(body?.reviews)) return body.reviews;
  if (Array.isArray(body?.data?.reviews)) return body.data.reviews;
  return [];
}

/**
 * POST /api/v1/website/reviews/sync
 *
 * Admin-only. Fetches Google Reviews from RapidAPI and upserts them into the
 * `testimonials` table with source="google". Safe to call multiple times —
 * existing records are identified by their externalId and updated in place.
 */
export const POST = withErrorHandling(async () => {
  await requirePermission("testimonials.manage");

  if (!RAPIDAPI_KEY || !SEARCH_ID) {
    return NextResponse.json(
      { error: "RAPIDAPI_REVIEWS_KEY or RAPIDAPI_REVIEWS_SEARCH_ID not configured" },
      { status: 503 },
    );
  }

  const url =
    `https://${RAPIDAPI_HOST}/getReviewsV2` +
    `?searchId=${SEARCH_ID}&sort=relevant&nextpage=false&lang=en&country=us`;

  const apiRes = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
    cache: "no-store",
  });

  if (!apiRes.ok) {
    const errBody = await apiRes.text();
    return NextResponse.json(
      { error: `RapidAPI error ${apiRes.status}`, detail: errBody },
      { status: 502 },
    );
  }

  const body = (await apiRes.json()) as RapidApiResponse;
  const reviews = extractReviews(body);

  if (reviews.length === 0) {
    return NextResponse.json({ synced: 0, total: 0, message: "No reviews returned from API" });
  }

  let synced = 0;

  for (const review of reviews) {
    const externalId = review.id ?? review.reviewId;
    if (!externalId) continue; // skip reviews without an ID — can't dedup

    const rating = Math.min(5, Math.max(1, Math.round(review.rating ?? 5)));
    const quote = (review.text ?? review.snippet ?? "").trim();
    if (!quote) continue; // skip empty reviews

    const customerName =
      review.name ?? review.user?.name ?? "Google Customer";
    const avatarUrl =
      review.profilePhoto ?? review.user?.avatar ?? null;

    await prisma.testimonial.upsert({
      where: { externalId },
      create: {
        externalId,
        customerName,
        location: "Google Review",
        avatarUrl,
        rating,
        quote,
        source: "google",
        status: "ACTIVE",
        sortOrder: 0,
      },
      update: {
        customerName,
        avatarUrl,
        rating,
        quote,
        // Don't overwrite admin changes to status/sortOrder on re-sync
      },
    });

    synced++;
  }

  return NextResponse.json({ synced, total: reviews.length });
});
