"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";

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
      className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-left text-xs font-bold transition-all duration-200 cursor-pointer ${
        active
          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.01]"
          : "border border-neutral-200/90 bg-neutral-50/70 text-neutral-700 hover:border-orange-400 hover:bg-orange-50/40 hover:text-neutral-950"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`size-2 shrink-0 rounded-full transition-transform ${
            active ? "bg-white scale-125" : "bg-neutral-300 group-hover:bg-orange-400"
          }`}
        />
        <span>{children}</span>
      </div>
      {active && <span className="text-[10px] uppercase tracking-wider text-white/90">Active</span>}
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
    <aside className="flex flex-col gap-6 rounded-3xl border border-neutral-200/90 bg-white p-6 shadow-xl lg:sticky lg:top-24">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-orange-600">
            <SlidersHorizontal className="size-4" />
          </div>
          <div>
            <span className="text-sm font-black text-neutral-950 uppercase tracking-tight">Fleet Filters</span>
            <p className="text-[10px] text-neutral-500">Refine by vehicle tier</p>
          </div>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 rounded-lg bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600 hover:bg-orange-100 transition cursor-pointer"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        )}
      </div>

      {/* Services Count Pill */}
      <div className="flex items-center justify-between rounded-2xl border border-orange-100 bg-orange-50/60 p-3.5">
        <span className="text-xs font-semibold text-neutral-700">Available Tiers</span>
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-black text-orange-600 border border-orange-200 shadow-sm">
          {total} Options
        </span>
      </div>

      {/* Service Type Selection */}
      <div className="space-y-3">
        <div className="text-[10px] font-black tracking-widest text-neutral-400 uppercase">
          Select Vehicle Category
        </div>
        <div className="flex flex-col gap-2">
          <FilterPill active={!currentCategory} onClick={() => updateParam("category", "all")}>
            All Chauffeur Fleet
          </FilterPill>
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              active={currentCategory.toLowerCase().trim() === cat.toLowerCase().trim()}
              onClick={() => updateParam("category", cat)}
            >
              {cat}
            </FilterPill>
          ))}
        </div>
      </div>

      {/* Executive Standards Box */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/50 p-4 space-y-2.5 shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
          <ShieldCheck className="size-4 text-emerald-600" /> SRM Executive Standard
        </div>
        <p className="text-[11px] leading-relaxed text-emerald-950/80">
          All bookings include an experienced uniformed chauffeur, vehicle sanitization, chilled mineral water, highway toll assistance, and real-time WhatsApp dispatch support.
        </p>
      </div>
    </aside>
  );
}
