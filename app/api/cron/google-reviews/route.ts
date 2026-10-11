import { NextResponse } from "next/server";

import { syncGoogleReviews } from "@/lib/google-reviews/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Weekly Google reviews refresh (Saturday 03:00 IST — see vercel.json). Works with Vercel Cron
 * (which sends `Authorization: Bearer $CRON_SECRET`) or any scheduler that sends that header.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await syncGoogleReviews({ mode: "incremental" }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
