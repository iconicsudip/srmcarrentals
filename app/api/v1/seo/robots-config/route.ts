import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export interface RobotsConfig {
  defaultAllow: string[];
  defaultDisallow: string[];
  crawlDelay?: number;
  aiBots: {
    name: string;
    userAgent: string;
    allowed: boolean;
    description: string;
  }[];
  customRawRules?: string;
  sitemapUrl: string;
  host: string;
}

const DEFAULT_ROBOTS: RobotsConfig = {
  defaultAllow: ["/"],
  defaultDisallow: ["/admin", "/api", "/account", "/checkout"],
  crawlDelay: 0,
  aiBots: [
    { name: "ChatGPT (GPTBot)", userAgent: "GPTBot", allowed: true, description: "OpenAI crawler for ChatGPT search indexation" },
    { name: "PerplexityBot", userAgent: "PerplexityBot", allowed: true, description: "Perplexity AI search engine answer crawler" },
    { name: "ClaudeBot (Anthropic)", userAgent: "ClaudeBot", allowed: true, description: "Anthropic Claude web indexing" },
    { name: "Google-Extended", userAgent: "Google-Extended", allowed: true, description: "Google Gemini & AI Overviews training crawler" },
    { name: "Applebot", userAgent: "Applebot", allowed: true, description: "Apple Intelligence & Siri search crawler" },
    { name: "Common Crawl (CCBot)", userAgent: "CCBot", allowed: false, description: "Bulk open internet scraping archive" },
  ],
  sitemapUrl: "/sitemap.xml",
  host: "https://srmcarrentals.in",
};

export const GET = withErrorHandling(async () => {
  await requirePermission("seo.manage");

  const setting = await prisma.setting.findUnique({
    where: { key: "seo.robots" },
  });

  if (!setting || !setting.value) {
    return ok(DEFAULT_ROBOTS);
  }

  return ok(setting.value);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const body = await req.json();

  const saved = await prisma.setting.upsert({
    where: { key: "seo.robots" },
    create: {
      key: "seo.robots",
      group: "seo",
      value: body,
    },
    update: {
      value: body,
    },
  });

  return ok(saved.value);
});
