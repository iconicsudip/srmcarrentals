import * as React from "react";

/** Shared, hook-free error layout (usable from server and client error files). */
export function ErrorScreen({
  code,
  title,
  message,
  actions,
  detail,
  fullscreen = true,
}: {
  code: string;
  title: string;
  message: string;
  actions: React.ReactNode;
  detail?: string;
  fullscreen?: boolean;
}) {
  return (
    <section
      className={`relative isolate flex items-center justify-center overflow-hidden bg-neutral-950 px-4 py-20 text-white ${
        fullscreen ? "min-h-svh" : "min-h-[70vh]"
      }`}
    >
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[34rem] w-[60rem] max-w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.28),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      {/* Oversized outlined code */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 text-[34vw] leading-none font-black tracking-tighter text-transparent select-none [-webkit-text-stroke:1px_rgba(255,255,255,0.08)] sm:text-[24rem]"
      >
        {code}
      </span>

      <div className="relative mx-auto max-w-xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-white/10 px-4 py-1.5 text-[11px] font-bold tracking-[0.28em] text-amber-300 uppercase backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_#fbbf24]" />
          Error {code}
        </span>

        <h1 className="mt-6 text-4xl leading-[1.02] font-black tracking-tight uppercase sm:text-6xl">
          {title}
          <span className="text-orange-500">.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/70">{message}</p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">{actions}</div>

        {detail && <p className="mt-8 text-[11px] tracking-wider text-white/35">Reference: {detail}</p>}
      </div>
    </section>
  );
}

export const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-3 text-sm font-black text-white shadow-xl shadow-orange-500/30 transition hover:from-orange-600 hover:to-amber-600 active:scale-95 cursor-pointer";
export const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:border-amber-400/60 hover:bg-white/20 active:scale-95 cursor-pointer";
