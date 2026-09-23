"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Globe,
  Car,
  MapPin,
  Plane,
  Compass,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SEO_TABS = [
  { label: "Global SEO", href: "/admin/seo", icon: Globe },
  { label: "Cars SEO", href: "/admin/seo/cars", icon: Car },
  { label: "Locations SEO", href: "/admin/seo/locations", icon: MapPin },
  { label: "Airports SEO", href: "/admin/seo/airports", icon: Plane },
  { label: "Sitemap", href: "/admin/seo/sitemap", icon: Compass },
  { label: "Redirects", href: "/admin/seo/redirects", icon: Link2 },
];

export function SeoNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 scrollbar-none">
      {SEO_TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
