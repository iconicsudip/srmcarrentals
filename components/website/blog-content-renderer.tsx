import React from "react";
import Link from "next/link";
import { ChevronRight, Info, Lightbulb } from "lucide-react";

interface BlogContentRendererProps {
  content: string;
}

export function BlogContentRenderer({ content }: BlogContentRendererProps) {
  // Normalize line breaks
  const rawLines = content.replace(/\r\n/g, "\n").split("\n");

  const elements: React.ReactNode[] = [];
  let index = 0;
  let inList: "ul" | "ol" | null = null;
  let listItems: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (inList === "ul") {
        elements.push(
          <ul key={`ul-${index++}`} className="my-5 space-y-2.5 pl-2">
            {listItems}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${index++}`} className="my-5 space-y-2.5 pl-2">
            {listItems}
          </ol>
        );
      }
      inList = null;
      listItems = [];
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const [header, , ...body] = tableRows;
      elements.push(
        <div key={`table-${index++}`} className="my-8 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-left text-sm text-white/80">
            {header && (
              <thead className="border-b border-white/10 bg-white/5 font-semibold text-white uppercase tracking-wider text-xs">
                <tr>
                  {header.map((col, cIdx) => (
                    <th key={cIdx} className="px-4 py-3 sm:px-6">
                      {formatInline(col.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-white/5">
              {body.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-3 sm:px-6 text-white/70">
                      {formatInline(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableRows = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i] ?? "";
    const trimmed = line.trim();

    // Check for empty line
    if (!trimmed) {
      flushList();
      flushTable();
      continue;
    }

    // Markdown Table detection: | Col1 | Col2 |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      inTable = true;
      const cells = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushList();
      const text = trimmed.slice(4);
      elements.push(
        <h3 key={index++} className="mt-8 mb-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {formatInline(text)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      const text = trimmed.slice(3);
      elements.push(
        <div key={index++} className="mt-12 mb-4 pt-6 border-t border-white/10">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl flex items-center gap-3">
            <span className="size-2 rounded-full bg-orange-500 inline-block" />
            {formatInline(text)}
          </h2>
        </div>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushList();
      const text = trimmed.slice(2);
      elements.push(
        <h1 key={index++} className="mt-10 mb-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
          {formatInline(text)}
        </h1>
      );
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushList();
      elements.push(<hr key={index++} className="my-10 border-white/10" />);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushList();
      const quoteText = trimmed.slice(2).trim();
      const isTip = quoteText.toLowerCase().includes("tip:") || quoteText.toLowerCase().includes("pro tip:");
      const isImportant = quoteText.toLowerCase().includes("important:") || quoteText.toLowerCase().includes("note:");

      elements.push(
        <blockquote
          key={index++}
          className={`my-6 rounded-2xl border-l-4 p-5 sm:p-6 backdrop-blur-sm ${
            isTip
              ? "border-amber-500 bg-amber-500/10 text-amber-200/90"
              : isImportant
              ? "border-orange-500 bg-orange-500/10 text-orange-200/90"
              : "border-orange-500/60 bg-white/[0.03] text-white/80"
          }`}
        >
          <div className="flex items-start gap-3">
            {isTip ? (
              <Lightbulb className="size-5 shrink-0 text-amber-400 mt-0.5" />
            ) : isImportant ? (
              <Info className="size-5 shrink-0 text-orange-400 mt-0.5" />
            ) : null}
            <div className="text-base leading-relaxed italic">{formatInline(quoteText)}</div>
          </div>
        </blockquote>
      );
      continue;
    }

    // Bullet List (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (inList !== "ul") {
        flushList();
        inList = "ul";
      }
      const itemText = trimmed.slice(2);
      listItems.push(
        <li key={`li-${index++}`} className="flex items-start gap-3 text-base text-white/80 leading-relaxed">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-400" />
          <span>{formatInline(itemText)}</span>
        </li>
      );
      continue;
    }

    // Numbered List (1. , 2. )
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (inList !== "ol") {
        flushList();
        inList = "ol";
      }
      const num = numMatch[1] ?? "1";
      const itemText = numMatch[2] ?? "";
      listItems.push(
        <li key={`oli-${index++}`} className="flex items-start gap-3.5 text-base text-white/80 leading-relaxed">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-xs font-bold text-orange-400 border border-orange-500/30">
            {num}
          </span>
          <span className="pt-0.5">{formatInline(itemText)}</span>
        </li>
      );
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={index++} className="my-4 text-base sm:text-lg text-white/80 leading-relaxed font-normal">
        {formatInline(trimmed)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className="blog-article-body space-y-2">{elements}</div>;
}

/**
 * Parses inline formatting: **bold**, *italic*, `code`, and [link](url)
 */
function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    type MatchType = { type: "link" | "bold" | "code"; index: number; length: number; match: RegExpMatchArray };
    const candidates: MatchType[] = [];

    if (linkMatch && linkMatch.index !== undefined) {
      candidates.push({ type: "link", index: linkMatch.index, length: linkMatch[0].length, match: linkMatch });
    }
    if (boldMatch && boldMatch.index !== undefined) {
      candidates.push({ type: "bold", index: boldMatch.index, length: boldMatch[0].length, match: boldMatch });
    }
    if (codeMatch && codeMatch.index !== undefined) {
      candidates.push({ type: "code", index: codeMatch.index, length: codeMatch[0].length, match: codeMatch });
    }

    if (candidates.length === 0) {
      parts.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.index - b.index);
    const earliest = candidates[0];
    if (!earliest) {
      parts.push(remaining);
      break;
    }

    // Push preceding text
    if (earliest.index > 0) {
      parts.push(remaining.substring(0, earliest.index));
    }

    if (earliest.type === "link") {
      const label = earliest.match[1] ?? "";
      const href = earliest.match[2] ?? "";
      const isExternal = href.startsWith("http://") || href.startsWith("https://");
      parts.push(
        <Link
          key={`inline-${key++}`}
          href={href || "#"}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-semibold text-orange-400 underline decoration-orange-500/40 underline-offset-4 hover:text-orange-300 hover:decoration-orange-400 transition-colors"
        >
          {label}
        </Link>
      );
    } else if (earliest.type === "bold") {
      parts.push(
        <strong key={`inline-${key++}`} className="font-bold text-white">
          {earliest.match[1] ?? ""}
        </strong>
      );
    } else if (earliest.type === "code") {
      parts.push(
        <code
          key={`inline-${key++}`}
          className="rounded bg-white/10 px-1.5 py-0.5 text-sm font-mono text-orange-300 border border-white/5"
        >
          {earliest.match[1] ?? ""}
        </code>
      );
    }

    remaining = remaining.substring(earliest.index + earliest.length);
  }

  return parts.length === 1 ? parts[0] : parts;
}
