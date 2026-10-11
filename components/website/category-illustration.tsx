import * as React from "react";

type Shape = { body: string; glass: string };

// Side-view silhouettes, one per body type (viewBox 0 0 120 60).
const SHAPES: Record<string, Shape> = {
  hatchback: {
    body: "M7 43 L9 35 L23 32 L35 18 L82 18 L99 30 L111 34 L113 43 Z",
    glass: "M38 21 L80 21 L92 30 L32 30 Z",
  },
  sedan: {
    body: "M6 43 L9 35 L26 31 L41 18 L77 18 L94 30 L111 34 L114 43 Z",
    glass: "M44 21 L75 21 L87 30 L37 30 Z",
  },
  "compact suv": {
    body: "M7 43 L8 32 L23 28 L34 14 L85 14 L103 28 L112 32 L113 43 Z",
    glass: "M37 17 L83 17 L96 28 L31 28 Z",
  },
  suv: {
    body: "M6 43 L6 30 L21 26 L31 11 L89 11 L108 27 L114 32 L114 43 Z",
    glass: "M34 14 L87 14 L101 26 L28 26 Z",
  },
  mpv: {
    body: "M5 43 L5 31 L17 27 L28 11 L97 11 L110 28 L115 33 L115 43 Z",
    glass: "M31 14 L62 14 L62 26 L24 26 Z M66 14 L94 14 L104 26 L66 26 Z",
  },
  luxury: {
    body: "M6 43 L11 36 L30 31 L47 20 L78 20 L100 32 L113 36 L114 43 Z",
    glass: "M50 23 L76 23 L91 31 L42 31 Z",
  },
};

function shapeFor(name: string): Shape {
  const n = name.toLowerCase();
  if (n.includes("compact")) return SHAPES["compact suv"]!;
  if (n.includes("hatch")) return SHAPES.hatchback!;
  if (n.includes("mpv") || n.includes("van") || n.includes("muv")) return SHAPES.mpv!;
  if (n.includes("suv") || n.includes("4x4") || n.includes("jeep")) return SHAPES.suv!;
  if (n.includes("sedan")) return SHAPES.sedan!;
  return SHAPES.luxury!;
}

/** Default picture for a car category without an uploaded image: a silhouette of that body type. */
export function CategoryIllustration({ name, className }: { name: string; className?: string }) {
  const { body, glass } = shapeFor(name);
  const id = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 60" className={className} role="img" aria-label={`${name} illustration`}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fb923c" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="52" rx="48" ry="3.2" fill="#000" opacity="0.12" />
      <path d={body} fill={`url(#b${id})`} />
      <path d={glass} fill="#fff7ed" opacity="0.92" />
      <path d="M60 18 L60 43" stroke="#c2410c" strokeWidth="0.8" opacity="0.5" />
      {[30, 90].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="44" r="8.5" fill="#1f2937" />
          <circle cx={cx} cy="44" r="4" fill="#e5e7eb" />
          <circle cx={cx} cy="44" r="1.4" fill="#6b7280" />
        </g>
      ))}
    </svg>
  );
}
