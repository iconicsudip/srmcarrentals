import slugify from "slugify";

/** Generate a URL-safe, lowercase, hyphenated slug. */
export function generateSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

/** Append a short random suffix to guarantee uniqueness on collision. */
export function makeSlugUnique(baseSlug: string, attempt: number): string {
  if (attempt <= 0) return baseSlug;
  return `${baseSlug}-${attempt + 1}`;
}
