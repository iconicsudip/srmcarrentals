import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { ApiHttpException } from "@/lib/http/errors";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getRobotsTxtState, resetRobotsTxt, saveRobotsTxt } from "@/lib/seo/robots-txt.server";

/** Admin: the robots.txt text (the saved one, or the default if none is saved). */
export const GET = withErrorHandling(async () => {
  await requirePermission("seo.manage");
  return ok(await getRobotsTxtState());
});

export const PUT = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const { content } = (await req.json()) as { content?: string };
  if (typeof content !== "string" || !content.trim()) throw new ApiHttpException(400, "robots.txt cannot be empty", "Bad Request");
  if (content.length > 20000) throw new ApiHttpException(400, "robots.txt is too long (20,000 characters at most)", "Bad Request");
  await saveRobotsTxt(content.replace(/\r\n/g, "\n"));
  return ok(await getRobotsTxtState());
});

/** Admin: go back to the default text. */
export const DELETE = withErrorHandling(async () => {
  await requirePermission("seo.manage");
  await resetRobotsTxt();
  return ok(await getRobotsTxtState());
});
