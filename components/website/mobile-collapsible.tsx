"use client";

import * as React from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

/** Collapsed behind a button below `lg`, always expanded on desktop. */
export function MobileCollapsible({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-sm font-bold text-neutral-900 shadow-sm lg:hidden"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-orange-500" />
          {label}
        </span>
        <ChevronDown className={`size-4 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`${open ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}>{children}</div>
    </div>
  );
}
