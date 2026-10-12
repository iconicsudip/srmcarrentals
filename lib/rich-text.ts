import sanitizeHtml from "sanitize-html";

export { isRichHtml, plainTextToHtml } from "@/lib/rich-text-shared";
import { isRichHtml } from "@/lib/rich-text-shared";

/** Strips scripts / event handlers / unknown tags — safe to render with dangerouslySetInnerHTML. */
export function sanitizeRichHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "a", "hr", "code", "pre"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", ...(attribs.href?.startsWith("http") ? { target: "_blank" } : {}) },
      }),
    },
  });
}

/** Plain text of a rich value (for meta descriptions, JSON-LD, previews). */
export function richTextToPlain(value: string): string {
  return isRichHtml(value) ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim() : value;
}
