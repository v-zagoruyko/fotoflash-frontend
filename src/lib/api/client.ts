// The only place that talks to the backend. Components never call fetch directly.

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    /** DRF field validation errors: `{ field: ["message"] }`. */
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

type Options = { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; signal?: AbortSignal };

const isServer = typeof window === "undefined";
// In the browser `/api/*` is same-origin (rewrites / Traefik); on the server go to the backend directly.
const origin = isServer ? (process.env.BACKEND_URL ?? "http://localhost:8000") : "";

let csrfToken: string | null = null;

async function ensureCsrf(force = false) {
  if (csrfToken && !force) return csrfToken;
  const res = await fetch(`${origin}/api/v1/auth/csrf/`, { credentials: "include" });
  csrfToken = ((await res.json()) as { csrfToken: string }).csrfToken;
  return csrfToken;
}

async function toError(res: Response) {
  const data = await res.json().catch(() => null);
  if (data && typeof data.detail === "string") return new ApiError(res.status, data.detail, data.code);
  if (data && typeof data === "object") {
    return new ApiError(res.status, "Проверьте введённые данные", undefined, data);
  }
  return new ApiError(res.status, "Что-то пошло не так, попробуйте позже");
}

export async function api<T = unknown>(path: string, { method = "GET", body, signal }: Options = {}): Promise<T> {
  const unsafe = method !== "GET";

  const send = async (forceCsrf: boolean) => {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (unsafe) headers["X-CSRFToken"] = await ensureCsrf(forceCsrf);
    return fetch(`${origin}/api/v1${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  };

  let res = await send(false);
  // Expired CSRF token: refresh once and retry. A 403 that carries our own `code` (account_disabled,
  // no session) is a real answer, repeating a POST would only double the side effects.
  if (res.status === 403 && unsafe) {
    const answer = await res.clone().json().catch(() => null);
    if (!answer?.code) res = await send(true);
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
