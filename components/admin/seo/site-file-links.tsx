"use client";

import * as React from "react";
import { Bot, Copy, ExternalLink, Map } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const FILES = [
  { path: "/robots.txt", label: "robots.txt", icon: Bot, hint: "Tells search engines what they may crawl" },
  { path: "/sitemap.xml", label: "sitemap.xml", icon: Map, hint: "The list of pages you submit to Google" },
];

/** The live robots.txt and sitemap.xml links, with open and copy buttons. */
export function SiteFileLinks() {
  const [origin, setOrigin] = React.useState("");
  React.useEffect(() => setOrigin(window.location.origin), []);

  const copy = (url: string) => navigator.clipboard.writeText(url).then(() => toast.success("Link copied"), () => toast.error("Could not copy"));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FILES.map(({ path, label, icon: Icon, hint }) => {
        const url = `${origin}${path}`;
        return (
          <div key={path} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-md">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{label}</div>
              <a href={path} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary block truncate font-mono text-xs" title={url}>
                {url || path}
              </a>
              <div className="text-muted-foreground text-[11px]">{hint}</div>
            </div>
            <Button type="button" variant="outline" size="icon" className="size-8" onClick={() => copy(url)} aria-label={`Copy ${label} link`}>
              <Copy className="size-3.5" />
            </Button>
            <Button asChild variant="outline" size="icon" className="size-8" aria-label={`Open ${label}`}>
              <a href={path} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
