import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names and resolve Tailwind conflicts. Standard
 * shadcn/ui helper — kept here (not just re-exported from @srm/ui) so the
 * `npx shadcn add <component>` CLI keeps working out of the box. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Website section headings always end with a styled orange "." appended by
 * the component itself — strip any trailing punctuation an admin typed into
 * the heading text so it never doubles up (e.g. "BUILT FOR BUSINESS." -> ".."). */
export function stripTrailingPunctuation(text: string): string {
  return text.replace(/[.!?\s]+$/, "");
}
