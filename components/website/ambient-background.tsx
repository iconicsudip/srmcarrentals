
// Deterministic particle layout (no Math.random → no hydration mismatch).
const DUST = [
  { left: "8%", top: "82%", size: 3, dur: 15, delay: 0, dx: 24 },
  { left: "17%", top: "64%", size: 2, dur: 18, delay: 3, dx: -18 },
  { left: "29%", top: "90%", size: 3, dur: 13, delay: 6, dx: 30 },
  { left: "41%", top: "72%", size: 2, dur: 20, delay: 1, dx: -22 },
  { left: "55%", top: "88%", size: 3, dur: 16, delay: 8, dx: 16 },
  { left: "66%", top: "68%", size: 2, dur: 17, delay: 4, dx: -26 },
  { left: "78%", top: "86%", size: 3, dur: 14, delay: 10, dx: 20 },
  { left: "90%", top: "70%", size: 2, dur: 19, delay: 2, dx: -14 },
];

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none bg-[#FAFAFC]"
    >
      {/* 1. Warm light pools — radial gradients instead of blur filters (cheap to paint) */}
      <div
        className="lux-orb absolute -top-40 -right-40 h-[720px] w-[720px] animate-pulse-slow"
        style={{ ["--orb-color" as string]: "rgba(251, 146, 60, 0.20)" }}
      />
      <div
        className="lux-orb absolute top-[34%] -left-56 h-[680px] w-[680px] animate-pulse-slow [animation-delay:4s]"
        style={{ ["--orb-color" as string]: "rgba(245, 158, 11, 0.14)" }}
      />
      <div
        className="lux-orb absolute -bottom-48 right-[8%] h-[640px] w-[640px]"
        style={{ ["--orb-color" as string]: "rgba(249, 115, 22, 0.12)" }}
      />

      {/* 2. Architectural grid texture */}
      <div className="bg-subtle-grid absolute inset-0 opacity-60" />

      {/* 3. Slow-rotating gold instrument rings (speedometer motif) */}
      <div className="lux-ring absolute -top-[260px] -right-[260px] h-[640px] w-[640px] rounded-full opacity-70" />
      <div className="lux-ring absolute top-[48%] -left-[320px] h-[560px] w-[560px] rounded-full opacity-50 [animation-direction:reverse]" />

      {/* 4. Headlight light streaks sweeping across */}
      <div className="lux-streak absolute top-[22%] left-0 h-px w-[40vw]" />
      <div className="lux-streak absolute top-[68%] left-0 h-px w-[32vw] [animation-delay:7s]" />

      {/* 5. Rising golden dust */}
      {DUST.map((d, i) => (
        <span
          key={i}
          className="lux-dust absolute rounded-full bg-amber-400/70 shadow-[0_0_8px_#f59e0b]"
          style={{
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            ["--dust-dur" as string]: `${d.dur}s`,
            ["--dust-delay" as string]: `${d.delay}s`,
            ["--drift-x" as string]: `${d.dx}px`,
          }}
        />
      ))}

      {/* 6. Soft vignette for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(15,23,42,0.04)_100%)]" />
    </div>
  );
}
