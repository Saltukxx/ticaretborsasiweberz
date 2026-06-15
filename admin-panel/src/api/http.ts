import { getAccessToken, setAccessToken } from "../auth/token";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown> };
export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

let sessionLostHandler: (() => void) | null = null;
export function setSessionLostHandler(fn: () => void) {
  sessionLostHandler = fn;
}

export function getBase(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    if (import.meta.env.DEV || import.meta.env.VITE_SAME_ORIGIN_API === "true") {
      return window.location.origin;
    }
    if (configured?.trim()) return configured.replace(/\/$/, "");
    return window.location.origin;
  }
  if (configured?.trim()) return configured.replace(/\/$/, "");
  throw new Error("VITE_API_URL is not set");
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getBase()}/api/v1/admin/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
      return json.data.accessToken;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function tryRestoreSession(): Promise<boolean> {
  const tok = await refreshAccessToken();
  if (!tok) return false;
  setAccessToken(tok);
  return true;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const body = init.body;
  if (body && typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${getBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text();
  let json: unknown = null;
  if (text && ct.includes("application/json")) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (res.status === 401) {
    const isAuth =
      path.includes("/auth/login") || path.includes("/auth/refresh");
    if (!retried && !isAuth) {
      const newTok = await refreshAccessToken();
      if (newTok) {
        setAccessToken(newTok);
        return apiRequest<T>(path, init, true);
      }
      setAccessToken(null);
      sessionLostHandler?.();
      throw new ApiError("UNAUTHORIZED", "Oturum sona erdi veya geçersiz.");
    }
    const err = json as ApiErrorBody | null;
    throw new ApiError(
      err?.error?.code ?? "UNAUTHORIZED",
      err?.error?.message ?? "Yetkisiz",
      err?.error?.details,
    );
  }

  if (!res.ok) {
    const err = json as ApiErrorBody | null;
    throw new ApiError(
      err?.error?.code ?? "HTTP_ERROR",
      err?.error?.message ?? res.statusText,
      err?.error?.details,
    );
  }

  return json as T;
}
