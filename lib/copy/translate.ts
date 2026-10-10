import { COPY } from "@/lib/copy/registry";

export type CopyOverrides = Record<string, string>;
export type T = (key: string, vars?: Record<string, string | number>) => string;

/** Build a translate function: admin override → registry default → the key itself. */
export function makeT(overrides: CopyOverrides = {}): T {
  return (key, vars) => {
    const raw = overrides[key]?.trim() ? overrides[key]! : (COPY[key]?.default ?? key);
    return vars ? raw.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : raw;
  };
}
