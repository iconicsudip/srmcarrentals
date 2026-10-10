"use client";

import * as React from "react";
import { Check, Copy, MessageCircle } from "lucide-react";

export function BlogShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = React.useState(false);

  const fullUrl = typeof window !== "undefined" ? window.location.href : url;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title} - Read more: ${fullUrl}`
  )}`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mr-1">Share:</span>
      
      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="flex size-8 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
      >
        <MessageCircle className="size-4" />
      </a>

      {/* X / Twitter */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-colors"
      >
        <span className="font-bold text-xs">𝕏</span>
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link"
        className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:border-orange-500 hover:text-orange-600 shadow-sm transition-colors"
      >
        {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
