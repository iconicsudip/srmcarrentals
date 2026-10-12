"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

const FALLBACK = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80&auto=format&fit=crop";

/** Article photo that falls back to a default picture when the saved link is broken. */
export function BlogImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const [url, setUrl] = React.useState(src || FALLBACK);
  React.useEffect(() => setUrl(src || FALLBACK), [src]);
  return <Image {...props} src={url} alt={alt} onError={() => url !== FALLBACK && setUrl(FALLBACK)} />;
}
