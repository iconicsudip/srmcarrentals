"use client";

import * as React from "react";

import { makeT, type CopyOverrides, type T } from "@/lib/copy/translate";

const CopyContext = React.createContext<T>(makeT());

/** Makes admin-editable page copy available to client components via `useCopy()`. */
export function CopyProvider({ overrides, children }: { overrides: CopyOverrides; children: React.ReactNode }) {
  const t = React.useMemo(() => makeT(overrides), [overrides]);
  return <CopyContext.Provider value={t}>{children}</CopyContext.Provider>;
}

export function useCopy(): T {
  return React.useContext(CopyContext);
}
