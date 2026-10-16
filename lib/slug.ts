/** Lower-case, hyphenated slug for names that have no stored slug (e.g. "Automatic" → "automatic"). */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Returns `base` if nobody uses it yet, otherwise `base-2`, `base-3`… — the first free one.
 * `isTaken` should ignore the record being edited so saving without changing the slug keeps it.
 */
export async function uniqueSlug(base: string, isTaken: (slug: string) => Promise<boolean>): Promise<string> {
  const root = toSlug(base) || "item";
  let candidate = root;
  for (let n = 2; await isTaken(candidate); n++) candidate = `${root}-${n}`;
  return candidate;
}
