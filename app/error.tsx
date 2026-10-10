"use client";

import { ErrorBoundaryView } from "@/components/errors/error-boundary-view";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorBoundaryView error={error} retry={retry} />;
}
