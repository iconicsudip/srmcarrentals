"use client";

import * as React from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";

import type { HomepageContent } from "@/modules/settings/site-content.schemas";
import { stripTrailingPunctuation } from "@/lib/utils";

export function VideoShowcaseSection({ content }: { content: HomepageContent["videoShowcase"] }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = React.useState(true);
  const [muted, setMuted] = React.useState(true);

  if (!content.videoUrl) return null;

  return (
    <section className="relative h-[70vh] min-h-[420px] overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={content.videoUrl}
        autoPlay
        loop
        muted={muted}
        playsInline
        className="absolute inset-0 size-full object-cover opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/70" />

      <div className="relative flex h-full flex-col items-center justify-center px-4 text-center">
        {content.badge && (
          <span className="mb-6 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-widest text-orange-500">
            {content.badge}
          </span>
        )}
        <h2 className="text-4xl leading-tight font-black text-white uppercase sm:text-6xl">
          {stripTrailingPunctuation(content.title)}
          <span className="text-orange-500">.</span>
        </h2>
        {content.subtitle && <p className="mt-4 max-w-xl text-white/60">{content.subtitle}</p>}
      </div>

      <div className="absolute right-6 bottom-6 flex gap-2">
        <button
          onClick={() => {
            if (playing) videoRef.current?.pause();
            else videoRef.current?.play();
            setPlaying((v) => !v);
          }}
          className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <button
          onClick={() => setMuted((v) => !v)}
          className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
        <button
          onClick={() => videoRef.current?.requestFullscreen()}
          className="flex size-9 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <Maximize className="size-4" />
        </button>
      </div>
    </section>
  );
}
