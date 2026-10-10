import { NextResponse } from "next/server";

import { getBuildId } from "@/lib/version/build-id";

export const dynamic = "force-dynamic";

/** Polled by the browser to learn whether a newer deployment is live. */
export function GET() {
  return NextResponse.json({ buildId: getBuildId() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
