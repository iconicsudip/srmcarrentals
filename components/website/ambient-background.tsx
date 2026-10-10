import React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none bg-[#FAFAFC]"
    >
      {/* 1. Atmospheric Luxury Warm Sunset Orbs (Subtle on White) */}
      {/* Top right golden orange aura */}
      <div className="absolute -top-32 -right-32 h-[650px] w-[650px] rounded-full bg-gradient-to-br from-orange-400/[0.12] via-amber-300/[0.08] to-transparent blur-[140px] animate-pulse-slow will-change-transform" />

      {/* Mid-left warm apricot aura */}
      <div className="absolute top-[30%] -left-48 h-[650px] w-[650px] rounded-full bg-gradient-to-tr from-orange-500/[0.07] via-amber-400/[0.05] to-transparent blur-[160px] animate-pulse-slow will-change-transform [animation-delay:4s]" />

      {/* Center soft sunbeam glow */}
      <div className="absolute top-[60%] left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-orange-500/[0.04] blur-[160px] will-change-transform" />

      {/* Bottom right subtle dusk reflection */}
      <div className="absolute -bottom-40 right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-amber-500/[0.08] via-orange-400/[0.04] to-transparent blur-[150px] will-change-transform" />

      {/* 2. Architectural Luxury Grid Texture Overlay */}
      <div className="bg-subtle-grid absolute inset-0 opacity-60" />

      {/* 3. Subtle floating golden micro-gleams */}
      <div className="absolute top-[18%] left-[22%] h-1 w-1 rounded-full bg-orange-400/60 shadow-[0_0_8px_#f97316] animate-float-slow" />
      <div className="absolute top-[28%] right-[18%] h-1.5 w-1.5 rounded-full bg-amber-400/50 shadow-[0_0_10px_#fbbf24] animate-float-slow [animation-delay:2.5s]" />
      <div className="absolute top-[52%] left-[12%] h-1 w-1 rounded-full bg-orange-400/50 shadow-[0_0_8px_#fb923c] animate-float-slow [animation-delay:1.2s]" />
      <div className="absolute top-[75%] right-[25%] h-1 w-1 rounded-full bg-amber-500/50 shadow-[0_0_8px_#f59e0b] animate-float-slow [animation-delay:3.8s]" />
    </div>
  );
}
