import type { ApiError } from "@srm/types";

export class ApiRequestError extends Error {
  status: number;
  body: ApiError | null;

  constructor(status: number, body: ApiError | null) {
    super(typeof body?.message === "string" ? body.message : "Request failed");
    this.status = status;
    this.body = body;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the automatic redirect-to-login on 401 (used by the login page itself). */
  skipAuthRedirect?: boolean;
}

const API_BASE = "/api/v1";

/** Thin fetch wrapper for same-origin Next.js Route Handlers. Auth tokens
 * travel as httpOnly cookies, so no Authorization header wiring is needed
 * here — the browser sends them automatically. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, skipAuthRedirect, headers, ...rest } = options;

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipAuthRedirect && typeof window !== "undefined") {
    if (!window.location.pathname.startsWith("/admin/login")) {
      window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  if (!response.ok) {
    let errorBody: ApiError | null = null;
    try {
      errorBody = await response.json();
    } catch {
      // no JSON body
    }
    throw new ApiRequestError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) => apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: ApiFetchOptions) => apiFetch<T>(path, { ...options, method: "DELETE" }),
};
