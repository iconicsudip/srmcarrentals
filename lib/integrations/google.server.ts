import { createSign } from "node:crypto";

import { getSetting, setSetting } from "@/modules/settings/settings.service";
import { prisma } from "@/lib/prisma";

/** Server-only. The service-account key is stored here and never sent back to the browser. */
export const GOOGLE_SETTING_KEY = "integrations.google";

interface GoogleIntegration {
  siteUrl: string; // the Search Console property, e.g. "https://srmcarrentals.in/" or "sc-domain:srmcarrentals.in"
  clientEmail: string;
  privateKey: string;
}

export interface GoogleStatus {
  configured: boolean;
  clientEmail: string;
  siteUrl: string;
}

async function read(): Promise<GoogleIntegration | null> {
  const v = await getSetting<Partial<GoogleIntegration>>(GOOGLE_SETTING_KEY);
  if (!v) return null;
  return { siteUrl: v.siteUrl ?? "", clientEmail: v.clientEmail ?? "", privateKey: v.privateKey ?? "" };
}

export async function getGoogleStatus(): Promise<GoogleStatus> {
  const v = await read();
  return { configured: Boolean(v?.clientEmail && v.privateKey), clientEmail: v?.clientEmail ?? "", siteUrl: v?.siteUrl ?? "" };
}

/** Saves the property and/or the service-account key (the JSON file Google gives you). Leave the key out to keep the saved one. */
export async function saveGoogleIntegration(input: { siteUrl?: string; serviceAccountJson?: string }): Promise<GoogleStatus> {
  const current = (await read()) ?? { siteUrl: "", clientEmail: "", privateKey: "" };
  const next: GoogleIntegration = { ...current };
  if (typeof input.siteUrl === "string") next.siteUrl = input.siteUrl.trim();
  if (input.serviceAccountJson?.trim()) {
    let parsed: { client_email?: string; private_key?: string };
    try {
      parsed = JSON.parse(input.serviceAccountJson);
    } catch {
      throw new Error("That is not valid JSON. Paste the whole contents of the downloaded key file.");
    }
    if (!parsed.client_email || !parsed.private_key) throw new Error("This JSON has no client_email / private_key — use the service account key file.");
    next.clientEmail = parsed.client_email;
    next.privateKey = parsed.private_key;
  }
  await setSetting(GOOGLE_SETTING_KEY, next);
  return getGoogleStatus();
}

export async function clearGoogleIntegration() {
  await prisma.setting.deleteMany({ where: { key: GOOGLE_SETTING_KEY } });
}

const b64url = (v: Buffer | string) => Buffer.from(v).toString("base64url");

async function accessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3300,
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(privateKey.replace(/\\n/g, "\n"));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${b64url(signature)}` }),
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(json.error_description || "Google rejected the service account key.");
  return json.access_token;
}

interface Row {
  keys?: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

async function query(token: string, siteUrl: string, body: Record<string, unknown>): Promise<Row[]> {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { rows?: Row[]; error?: { message?: string } };
  if (!res.ok) {
    const msg = json.error?.message || `Search Console returned ${res.status}`;
    throw new Error(
      res.status === 403
        ? `${msg} — add the service account's email as a user (Restricted or Full) in Search Console → Settings → Users and permissions.`
        : msg,
    );
  }
  return json.rows ?? [];
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function sum(rows: Row[]) {
  const clicks = rows.reduce((a, r) => a + r.clicks, 0);
  const impressions = rows.reduce((a, r) => a + r.impressions, 0);
  const posWeighted = rows.reduce((a, r) => a + r.position * r.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? posWeighted / impressions : 0 };
}

export interface SearchConsoleReport {
  range: { start: string; end: string };
  totals: ReturnType<typeof sum>;
  previous: ReturnType<typeof sum>;
  daily: { date: string; clicks: number; impressions: number }[];
  queries: { key: string; clicks: number; impressions: number; ctr: number; position: number }[];
  pages: { key: string; clicks: number; impressions: number; ctr: number; position: number }[];
}

/** Clicks, impressions, CTR and position from Google Search Console for the last `days` days (data lags ~2 days). */
export async function getSearchConsoleReport(days = 28): Promise<SearchConsoleReport> {
  const cfg = await read();
  if (!cfg?.clientEmail || !cfg.privateKey) throw new Error("Connect a Google service account first.");
  if (!cfg.siteUrl) throw new Error("Enter your Search Console property first.");

  const token = await accessToken(cfg.clientEmail, cfg.privateKey);
  const end = new Date(Date.now() - 2 * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  const prevEnd = new Date(start.getTime() - 86400000);
  const prevStart = new Date(prevEnd.getTime() - (days - 1) * 86400000);
  const range = { startDate: iso(start), endDate: iso(end) };

  const [daily, queries, pages, previous] = await Promise.all([
    query(token, cfg.siteUrl, { ...range, dimensions: ["date"], rowLimit: 500 }),
    query(token, cfg.siteUrl, { ...range, dimensions: ["query"], rowLimit: 15 }),
    query(token, cfg.siteUrl, { ...range, dimensions: ["page"], rowLimit: 15 }),
    query(token, cfg.siteUrl, { startDate: iso(prevStart), endDate: iso(prevEnd), dimensions: ["date"], rowLimit: 500 }),
  ]);

  const shape = (r: Row) => ({ key: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });
  return {
    range: { start: range.startDate, end: range.endDate },
    totals: sum(daily),
    previous: sum(previous),
    daily: daily.map((r) => ({ date: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions })).sort((a, b) => a.date.localeCompare(b.date)),
    queries: queries.map(shape),
    pages: pages.map(shape),
  };
}
