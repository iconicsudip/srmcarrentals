"use client";

import { useCopy } from "@/components/copy-provider";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

import { ErrorScreen, ghostBtn, primaryBtn } from "@/components/errors/error-screen";

const CHUNK_RE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|importing a module script failed/i;

/** Client view used by every `error.tsx` boundary. Detects "new deployment" chunk failures. */
export function ErrorBoundaryView({
  error,
  retry,
  homeHref = "/",
  fullscreen = true,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  fullscreen?: boolean;
}) {
  const t = useCopy();
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  const isStale = CHUNK_RE.test(`${error?.name} ${error?.message}`);

  return (
    <ErrorScreen
      code={isStale ? "UPDATE" : "500"}
      title={isStale ? "A new version is live" : "Something went wrong"}
      message={
        isStale
          ? "We just released an update and this page is out of date. Refresh to load the latest version."
          : "An unexpected error occurred on our side. You can try again, or head back to the homepage."
      }
      detail={error?.digest}
      fullscreen={fullscreen}
      actions={
        <>
          {isStale ? (
            <button type="button" onClick={() => window.location.reload()} className={primaryBtn}>
              <RefreshCw className="size-4" /> {t("errors.refresh-page")}
            </button>
          ) : (
            <button type="button" onClick={() => retry()} className={primaryBtn}>
              <RefreshCw className="size-4" /> {t("errors.try-again")}
            </button>
          )}
          <Link href={homeHref} className={ghostBtn}>
            <ArrowLeft className="size-4" /> {t("errors.back-to-home")}
          </Link>
        </>
      }
    />
  );
}
