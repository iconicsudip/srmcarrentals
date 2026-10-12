// Client-safe helpers (no sanitizer) — see lib/rich-text.ts for the server-side sanitizer.

/** True when the stored text came from the rich-text editor (HTML) rather than legacy plain text. */
export function isRichHtml(value: string | null | undefined): boolean {
  return !!value && /^\s*<(p|h[1-6]|ul|ol|blockquote|div|img|table)[\s>]/i.test(value);
}

/** Wraps legacy plain text (blank-line separated paragraphs) as HTML so the editor can open it. */
export function plainTextToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

