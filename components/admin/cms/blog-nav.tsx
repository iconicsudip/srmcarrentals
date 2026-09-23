"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Newspaper, FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOG_TABS = [
  { label: "Blog Articles", href: "/admin/cms/blog", icon: Newspaper },
  { label: "Blog Categories", href: "/admin/cms/blog-categories", icon: FolderTree },
];

export function BlogNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-3 scrollbar-none">
      {BLOG_TABS.map((tab) => {
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
