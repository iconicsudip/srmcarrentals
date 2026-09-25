"use client";

import * as React from "react";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";

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
      <span className="text-xs font-semibold uppercase tracking-wider text-white/40 mr-1">Share:</span>
      
      {/* WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="flex size-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
      >
        <MessageCircle className="size-4" />
      </a>

      {/* X / Twitter */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        <span className="font-bold text-xs">𝕏</span>
      </a>

      {/* Copy Link */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link"
        className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
      >
        {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
