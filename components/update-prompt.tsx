"use client";

import * as React from "react";
import { RefreshCw, WifiOff, X } from "lucide-react";

const POLL_MS = 60_000;
const CHUNK_RE = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|importing a module script failed/i;

/**
 * Watches for (a) a newer deployment and (b) connectivity loss.
 * `buildId` is baked into the page the visitor loaded, so a mismatch with the live
 * /api/version means they are running stale code.
 */
export function UpdatePrompt({ buildId }: { buildId: string }) {
  const [updateReady, setUpdateReady] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    if (buildId === "dev") return;
    let stopped = false;

    const check = async () => {
      if (stopped || document.hidden) return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        if (data.buildId && data.buildId !== "dev" && data.buildId !== buildId) {
          setUpdateReady(true);
        }
      } catch {
        /* offline / transient — ignore */
      }
    };

    const id = window.setInterval(check, POLL_MS);
    const onVisible = () => !document.hidden && void check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    // A failed JS chunk almost always means the old build was replaced.
    const onError = (e: ErrorEvent) => CHUNK_RE.test(`${e.message} ${e.error?.name ?? ""}`) && setUpdateReady(true);
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason as { name?: string; message?: string } | undefined;
      if (CHUNK_RE.test(`${r?.name ?? ""} ${r?.message ?? ""}`)) setUpdateReady(true);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [buildId]);

  React.useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <>
      {offline && (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-lg"
        >
          <WifiOff className="size-4" /> You&apos;re offline — some features may not work until you reconnect.
        </div>
      )}

      {updateReady && !dismissed && (
        <div
          role="alertdialog"
          aria-live="polite"
          aria-label="New version available"
          className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-md rounded-2xl border border-amber-400/40 bg-neutral-950/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-xl animate-in slide-in-from-bottom-4 sm:right-4 sm:bottom-4 sm:left-auto sm:mx-0"
        >
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 via-orange-500 to-orange-600 text-white">
              <RefreshCw className="size-5" />
            </span>
            <div>
              <p className="text-sm font-black">A new version is available</p>
              <p className="mt-0.5 text-xs leading-relaxed text-white/65">
                We&apos;ve updated the site. Refresh to get the latest features and prices.
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-black text-white shadow-lg shadow-orange-500/30 transition active:scale-[0.98]"
            >
              Refresh now
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-xl border border-white/20 px-4 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
