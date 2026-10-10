import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: string | null = null;

/** Id of the running production build (`.next/BUILD_ID`); "dev" when running `next dev`. */
export function getBuildId(): string {
  if (cached) return cached;
  try {
    cached = readFileSync(join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim() || "dev";
  } catch {
    cached = "dev";
  }
  return cached;
}
