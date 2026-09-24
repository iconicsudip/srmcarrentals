import React from "react";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* 1. Atmospheric Ambient Color Orbs */}
      {/* Top right golden orange aura */}
      <div className="absolute -top-32 -right-32 h-[550px] w-[550px] rounded-full bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent blur-[140px] animate-pulse-slow will-change-transform" />

      {/* Mid-left deep bronze aura */}
      <div className="absolute top-[35%] -left-48 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-amber-600/10 via-orange-600/6 to-transparent blur-[160px] animate-pulse-slow will-change-transform [animation-delay:4s]" />

      {/* Center subtle warm glow */}
      <div className="absolute top-[60%] left-1/2 -translate-x-1/2 h-[450px] w-[800px] rounded-full bg-orange-500/[0.04] blur-[150px] will-change-transform" />

      {/* Bottom right sunset reflection */}
      <div className="absolute -bottom-40 right-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-orange-500/10 via-amber-600/5 to-transparent blur-[140px] will-change-transform" />

      {/* 2. Cyber-Luxury Grid Texture Masked Overlay */}
      <div className="bg-subtle-grid absolute inset-0 opacity-40 mix-blend-screen" />

      {/* 3. Floating Micro-Gleams (Subtle Floating Stars/Gleams) */}
      <div className="absolute top-[18%] left-[22%] h-1 w-1 rounded-full bg-orange-400/50 shadow-[0_0_8px_#f97316] animate-float-slow" />
      <div className="absolute top-[28%] right-[18%] h-1.5 w-1.5 rounded-full bg-amber-300/40 shadow-[0_0_10px_#fbbf24] animate-float-slow [animation-delay:2.5s]" />
      <div className="absolute top-[52%] left-[12%] h-1 w-1 rounded-full bg-orange-300/40 shadow-[0_0_8px_#fb923c] animate-float-slow [animation-delay:1.2s]" />
      <div className="absolute top-[75%] right-[25%] h-1 w-1 rounded-full bg-amber-400/40 shadow-[0_0_8px_#f59e0b] animate-float-slow [animation-delay:3.8s]" />

      {/* 4. Vignette Shadow Overlay (Depth Enhancer) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
    </div>
  );
}
