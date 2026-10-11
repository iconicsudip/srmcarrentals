import { unstable_cache } from "next/cache";

import { getSetting } from "@/modules/settings/settings.service";

export const INSTAGRAM_SETTING_KEY = "integrations.instagram";
const MAX_POSTS = 60;

export interface InstagramPost {
  id: string;
  imageUrl: string;
  permalink: string;
  caption: string | null;
  isVideo: boolean;
}

async function getToken(): Promise<string> {
  const s = await getSetting<{ accessToken?: string }>(INSTAGRAM_SETTING_KEY);
  return (s?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || "").trim();
}

interface GraphMedia {
  id: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
}

/** Fetches the account's posts from the Instagram API (token from admin settings). Throws on API errors. */
export async function fetchInstagramPosts(token: string, limit = MAX_POSTS): Promise<InstagramPost[]> {
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink";
  let url: string | null = `https://graph.instagram.com/me/media?fields=${fields}&limit=30&access_token=${encodeURIComponent(token)}`;
  const posts: InstagramPost[] = [];

  while (url && posts.length < limit) {
    const res: Response = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as { data?: GraphMedia[]; paging?: { next?: string }; error?: { message?: string } };
    if (!res.ok || json.error) throw new Error(json.error?.message || `Instagram API error (${res.status})`);
    for (const m of json.data ?? []) {
      const img = m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url;
      if (!img || !m.permalink) continue;
      posts.push({ id: m.id, imageUrl: img, permalink: m.permalink, caption: m.caption ?? null, isVideo: m.media_type === "VIDEO" });
    }
    url = json.paging?.next ?? null;
  }
  return posts.slice(0, limit);
}

/** Public feed for the homepage: cached for an hour; returns [] when not connected or on any error. */
export const getInstagramFeed = unstable_cache(
  async (): Promise<InstagramPost[]> => {
    try {
      const token = await getToken();
      if (!token) return [];
      return await fetchInstagramPosts(token);
    } catch (err) {
      console.warn("[Instagram] feed unavailable:", (err as Error).message);
      return [];
    }
  },
  ["instagram-feed"],
  { revalidate: 3600, tags: ["instagram-feed"] },
);
