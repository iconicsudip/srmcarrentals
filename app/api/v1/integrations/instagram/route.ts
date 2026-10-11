import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getSetting } from "@/modules/settings/settings.service";
import { fetchInstagramPosts, INSTAGRAM_SETTING_KEY } from "@/lib/instagram/feed";

/** Admin: test the saved Instagram token and report how many posts it can read. */
export const GET = withErrorHandling(async () => {
  await requirePermission("settings.manage");
  const s = await getSetting<{ accessToken?: string }>(INSTAGRAM_SETTING_KEY);
  const token = (s?.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN || "").trim();
  if (!token) return ok({ connected: false, message: "No access token saved yet." });
  try {
    const posts = await fetchInstagramPosts(token, 60);
    return ok({ connected: true, count: posts.length, message: `Connected — ${posts.length} posts found.` });
  } catch (e) {
    return ok({ connected: false, message: (e as Error).message });
  }
});
