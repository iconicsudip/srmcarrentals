"use client";

import * as React from "react";
import Image from "next/image";
import { CarFront } from "lucide-react";

import { getCarFallbackImage } from "@/lib/car-fallback-image";

/** Car photo with a stock-photo fallback when the uploaded image is missing or fails to load. */
export function CarThumb({ src, name, className = "size-14", sizes = "120px" }: { src?: string | null; name: string; className?: string; sizes?: string }) {
  const [failed, setFailed] = React.useState(false);
  const [fallbackFailed, setFallbackFailed] = React.useState(false);
  const url = !src || failed ? getCarFallbackImage(name) : src;

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 ${className}`}>
      {fallbackFailed ? (
        <div className="flex size-full items-center justify-center text-orange-500">
          <CarFront className="size-1/3" />
        </div>
      ) : (
        <Image
          src={url}
          alt={name}
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => (failed ? setFallbackFailed(true) : setFailed(true))}
        />
      )}
    </div>
  );
}
