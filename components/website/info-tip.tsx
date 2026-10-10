"use client";

import * as React from "react";
import { Info } from "lucide-react";

/** Small "i" icon that reveals extra detail on hover, keyboard focus, or tap. */
export function InfoTip({ children, label = "More info", className = "" }: { children: React.ReactNode; label?: string; className?: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLSpanElement>(null);
  const id = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex ${className}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="flex size-5 items-center justify-center rounded-full text-neutral-400 transition hover:bg-orange-50 hover:text-orange-600 focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:outline-none"
      >
        <Info className="size-4" />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute top-full right-0 z-50 mt-2 w-64 max-w-[78vw] rounded-xl border border-neutral-200 bg-white p-3 text-left text-[11px] leading-relaxed font-medium text-neutral-700 shadow-xl animate-in fade-in zoom-in-95"
        >
          {children}
        </span>
      )}
    </span>
  );
}
