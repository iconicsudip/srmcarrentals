"use client";

import { ErrorBoundaryView } from "@/components/errors/error-boundary-view";

// Renders inside the site header/footer, so only fill the content area.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorBoundaryView error={error} retry={retry} fullscreen={false} />;
}
