import { isRichHtml, sanitizeRichHtml } from "@/lib/rich-text";

/** Renders editor content (HTML, sanitized) or legacy plain text with the same look. */
export function RichText({ value, className = "" }: { value: string; className?: string }) {
  if (!value) return null;
  if (!isRichHtml(value)) {
    return (
      <div className={`rich-text ${className}`}>
        {value
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
      </div>
    );
  }
  return <div className={`rich-text ${className}`} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(value) }} />;
}
