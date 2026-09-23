"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, SlidersHorizontal } from "lucide-react";

interface ChauffeurFilterSidebarProps {
  categories: string[];
  total: number;
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
        active
          ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
          : "border border-white/8 bg-white/4 text-white/55 hover:border-white/20 hover:text-white"
      }`}
    >
      {active && <span className="size-1.5 shrink-0 rounded-full bg-orange-400" />}
      {children}
    </button>
  );
}

export function ChauffeurFilterSidebar({ categories, total }: ChauffeurFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";

  const hasActiveFilters = !!currentCategory;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <aside className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-neutral-900 p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:rgba(249,115,22,0.3)_transparent]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-orange-500" />
          <span className="text-sm font-black text-white">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 text-[10px] font-semibold text-orange-400 hover:text-orange-300 transition"
          >
            <RotateCcw className="size-3" /> Clear All
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-white/8 bg-black/30 p-3">
        <span className="text-xs text-white/45">
          <span className="font-bold text-white">{total}</span> services available
        </span>
      </div>

      {/* Service Type */}
      <div className="border-t border-white/8 pt-4">
        <div className="mb-3 text-[10px] font-bold tracking-widest text-white/50 uppercase">
          Service Type
        </div>
        <div className="flex flex-col gap-1.5">
          <FilterPill active={!currentCategory} onClick={() => updateParam("category", "all")}>
            All Services
          </FilterPill>
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              active={currentCategory === cat}
              onClick={() => updateParam("category", cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-orange-500/15 bg-orange-500/5 p-3">
        <p className="text-[11px] leading-relaxed text-white/50">
          All services include professional chauffeur, transparent pricing, and real-time tracking.
        </p>
      </div>
    </aside>
  );
}
