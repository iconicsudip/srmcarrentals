"use client";

import * as React from "react";
import Image from "next/image";
import { CarFront, ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarGalleryProps {
  images: { url: string; altText: string | null }[];
  name: string;
  /** Shown when the car has no photos, or a photo fails to load. */
  fallbackSrc?: string;
}

export function CarGallery({ images: rawImages, name, fallbackSrc }: CarGalleryProps) {
  const [active, setActive] = React.useState(0);
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});

  const images =
    rawImages.length > 0
      ? rawImages.map((img) => (failed[img.url] && fallbackSrc ? { ...img, url: fallbackSrc } : img))
      : fallbackSrc
        ? [{ url: fallbackSrc, altText: name }]
        : [];

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-100 text-neutral-300">
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
      <div className="group relative aspect-video overflow-hidden rounded-3xl border border-neutral-200/90 bg-gradient-to-b from-neutral-50 via-white to-neutral-50 p-4 shadow-xl shadow-neutral-900/5">
        <Image
          src={activeImage!.url}
          alt={activeImage!.altText ?? name}
          fill
          sizes="(max-width: 1024px) 100vw, 800px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setFailed((f) => ({ ...f, [rawImages[active]?.url ?? ""]: true }))}
          priority
        />

        {/* Feature Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          <Badge className="border-emerald-500/30 bg-white/90 text-emerald-700 shadow-sm backdrop-blur-md">
            <ShieldCheck className="mr-1 size-3" /> Fully Sanitized
          </Badge>
          <Badge className="border-neutral-200 bg-white/90 text-neutral-800 shadow-sm backdrop-blur-md">
            <Sparkles className="mr-1 size-3 text-orange-500" /> Premium Fleet
          </Badge>
        </div>

        {/* Image Counter Badge */}
        {images.length > 1 && (
          <div className="absolute right-4 bottom-4 rounded-full border border-neutral-200 bg-white/90 px-3 py-1 text-xs font-mono text-neutral-700 shadow-sm backdrop-blur-md">
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
              className="absolute top-1/2 left-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-800 opacity-0 shadow-md backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-orange-500 hover:text-white"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next image"
              className="absolute top-1/2 right-3 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-800 opacity-0 shadow-md backdrop-blur-md transition-opacity group-hover:opacity-100 hover:bg-orange-500 hover:text-white"
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
                  ? "border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/20"
                  : "border-neutral-200 bg-white opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={img.url} alt={img.altText ?? ""} fill sizes="120px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
