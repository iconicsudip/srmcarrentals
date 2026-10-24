import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/modules/settings/settings.service";

export const ROBOTS_TXT_KEY = "seo.robots_txt";

/** In the saved text, this stands for the site address, so the same file works on every domain. */
export const SITE_URL_TOKEN = "{SITE_URL}";

const DEFAULT_DISALLOW = ["/admin", "/api", "/account", "/checkout"];
const BLOCKED_BY_DEFAULT = ["CCBot"];
const AI_BOTS = ["GPTBot", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot", "CCBot"];

function block(agent: string, allowed: boolean, disallow: string[], allow: string[] = ["/"]) {
  const lines = [`User-agent: ${agent}`];
  if (allowed) {
    for (const a of allow) lines.push(`Allow: ${a}`);
    for (const d of disallow) lines.push(`Disallow: ${d}`);
  } else {
    lines.push("Disallow: /");
  }
  return lines.join("\n");
}

/** The starting robots.txt: everyone may crawl the public site; private areas are blocked; bulk scrapers are kept out. */
export function buildDefaultRobotsTxt(opts: { disallow?: string[]; allow?: string[]; blockedBots?: string[]; crawlDelay?: number } = {}): string {
  const disallow = opts.disallow?.length ? opts.disallow : DEFAULT_DISALLOW;
  const blocked = new Set(opts.blockedBots ?? BLOCKED_BY_DEFAULT);
  const star = [block("*", true, disallow, opts.allow?.length ? opts.allow : ["/"])];
  if (opts.crawlDelay) star[0] += `\nCrawl-delay: ${opts.crawlDelay}`;
  const header = "# robots.txt — tells search engines and AI crawlers what they may visit.\n# Lines starting with # are comments.";
  const bots = "# AI & search assistants\n" + AI_BOTS.map((b) => block(b, !blocked.has(b), disallow)).join("\n\n");
  return [header, star[0], bots, `Sitemap: ${SITE_URL_TOKEN}/sitemap.xml`].join("\n\n") + "\n";
}

/** Earlier versions kept structured settings; use them to build the first text so nothing already configured is lost. */
async function defaultFromLegacy(): Promise<string> {
  const legacy = await getSetting<{ defaultAllow?: string[]; defaultDisallow?: string[]; crawlDelay?: number; aiBots?: { userAgent: string; allowed: boolean }[] }>("seo.robots");
  if (!legacy) return buildDefaultRobotsTxt();
  const blockedBots = legacy.aiBots?.filter((b) => !b.allowed).map((b) => b.userAgent);
  return buildDefaultRobotsTxt({ disallow: legacy.defaultDisallow, allow: legacy.defaultAllow, blockedBots, crawlDelay: legacy.crawlDelay });
}

export async function getRobotsTxtState(): Promise<{ content: string; isDefault: boolean; defaultContent: string }> {
  const [saved, defaultContent] = await Promise.all([getSetting<{ content?: string }>(ROBOTS_TXT_KEY), defaultFromLegacy()]);
  return typeof saved?.content === "string" && saved.content.trim()
    ? { content: saved.content, isDefault: false, defaultContent }
    : { content: defaultContent, isDefault: true, defaultContent };
}

export async function saveRobotsTxt(content: string) {
  await setSetting(ROBOTS_TXT_KEY, { content });
}

export async function resetRobotsTxt() {
  await prisma.setting.deleteMany({ where: { key: ROBOTS_TXT_KEY } });
}

export function renderRobotsTxt(content: string, siteUrl: string): string {
  return content.split(SITE_URL_TOKEN).join(siteUrl.replace(/\/$/, ""));
}
