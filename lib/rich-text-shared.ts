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


/** Plain-text excerpt of article content (HTML or Markdown) for cards and meta descriptions. */
export function excerptFrom(content: string | null | undefined, max = 180): string {
  const text = (content ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/^\s*\|.*\|\s*$/gm, " ") // tables
    .replace(/^\s*[-*_]{3,}\s*$/gm, " ") // horizontal rules
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s*>\s?/gm, "") // quotes
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "") // list markers
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trim()}…`;
}

/** Small Markdown → HTML converter so older articles open properly formatted in the rich-text editor. */
export function markdownToHtml(md: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join("<br>")}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };
  for (const raw of md.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trim();
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    const ul = /^[-*+]\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (!line) {
      flushPara();
      flushList();
    } else if (/^[-*_]{3,}$/.test(line)) {
      flushPara();
      flushList();
      out.push("<hr>");
    } else if (h) {
      flushPara();
      flushList();
      out.push(`<h${h[1]!.length <= 2 ? 2 : 3}>${inline(h[2]!)}</h${h[1]!.length <= 2 ? 2 : 3}>`);
    } else if (ul || ol) {
      flushPara();
      const kind = ul ? "ul" : "ol";
      if (list !== kind) {
        flushList();
        out.push(`<${kind}>`);
        list = kind;
      }
      out.push(`<li>${inline((ul ?? ol)![1]!)}</li>`);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();
  return out.join("");
}

/** True for text that uses Markdown markers (headings, bold, rules, lists). */
export function looksLikeMarkdown(text: string): boolean {
  return /(^|\n)\s{0,3}#{1,6}\s|\*\*[^*]+\*\*|(^|\n)\s*[-*]{3,}\s*(\n|$)|(^|\n)\s*(?:[-*+]|\d+\.)\s+\S/.test(text);
}
