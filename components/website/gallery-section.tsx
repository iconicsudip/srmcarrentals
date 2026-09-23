import Image from "next/image";
import { Camera } from "lucide-react";

import type { CompanyContent } from "@/modules/settings/site-content.schemas";

export interface GalleryImageData {
  id: string;
  imageUrl: string;
  caption: string | null;
  link: string | null;
}

export function GallerySection({ images, company }: { images: GalleryImageData[]; company: CompanyContent }) {
  if (images.length === 0) return null;
  const handle = company.socialLinks.instagram ? "@" + company.socialLinks.instagram.split("/").filter(Boolean).pop() : null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-widest text-orange-500">
            <Camera className="size-3" /> SOCIAL CHRONICLES
          </span>
          <h2 className="mt-3 text-3xl font-black text-white uppercase sm:text-4xl">
            Follow The Journey<span className="text-orange-500">.</span>
          </h2>
          {handle && <p className="mt-1 text-white/50">Tag {handle} to be featured in our gallery.</p>}
        </div>
        {company.socialLinks.instagram && (
          <a
            href={company.socialLinks.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            <Camera className="size-4" /> Visit {handle}
          </a>
        )}
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {images.map((image) => {
          const content = (
            <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
              <Image src={image.imageUrl} alt={image.caption ?? ""} fill sizes="300px" className="object-cover transition-transform hover:scale-105" />
            </div>
          );
          return image.link ? (
            <a key={image.id} href={image.link} target="_blank" rel="noreferrer">
              {content}
            </a>
          ) : (
            <div key={image.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
