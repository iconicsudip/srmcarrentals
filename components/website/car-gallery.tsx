"use client";

import * as React from "react";
import Image from "next/image";
import { CarFront, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarGalleryProps {
  images: { url: string; altText: string | null }[];
  name: string;
}

export function CarGallery({ images, name }: CarGalleryProps) {
  const [active, setActive] = React.useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-3xl border border-white/10 bg-neutral-900/80 text-white/20">
        <CarFront className="size-20" />
      </div>
    );
  }

  const activeImage = images[active] ?? images[0];

  const handlePrev = () => {
    setActive((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActive((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Display */}
      <div className="group relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black p-4 shadow-2xl">
        <Image
          src={activeImage!.url}
          alt={activeImage!.altText ?? name}
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          priority
        />

        {/* Feature Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge className="border-emerald-500/30 bg-emerald-500/20 text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="mr-1 size-3" /> Fully Sanitized
          </Badge>
          <Badge className="border-white/10 bg-black/60 text-white/80 backdrop-blur-md">
            <Sparkles className="mr-1 size-3 text-orange-400" /> Premium Fleet
          </Badge>
        </div>

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <div className="absolute right-4 bottom-4 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-xs font-mono text-white/70 backdrop-blur-md">
            {active + 1} / {images.length}
          </div>
        )}

        {/* Arrow Navigation */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-orange-500"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-orange-500"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, i) => (
            <button
              type="button"
              key={img.url + i}
              onClick={() => setActive(i)}
              className={`relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:w-28 ${
                i === active
                  ? "border-orange-500 ring-2 ring-orange-500/40"
                  : "border-white/10 opacity-60 hover:opacity-100"
              } bg-black/40`}
            >
              <Image src={img.url} alt={img.altText ?? ""} fill sizes="120px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
