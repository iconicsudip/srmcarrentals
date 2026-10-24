import { getRobotsTxtState, renderRobotsTxt } from "@/lib/seo/robots-txt.server";

// Read on every request so edits in Admin → SEO → Robots.txt show up at once
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  let content: string;
  try {
    content = (await getRobotsTxtState()).content;
  } catch {
    content = "User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\n\nSitemap: {SITE_URL}/sitemap.xml\n"; // database unavailable
  }
  return new Response(renderRobotsTxt(content, siteUrl), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=300" },
  });
}
