export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type ApiError = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  method: Method,
  path: string,
  token?: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = (await safeJson(res)) as ApiError | null;

  if (!res.ok) {
    throw new Error(
      payload?.error?.message ?? `API ${res.status} ${res.statusText}`,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (payload ?? ({} as T)) as T;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function apiGet<T>(path: string, token?: string) {
  return request<T>("GET", path, token);
}

export function apiPost<T>(path: string, body: unknown, token?: string) {
  return request<T>("POST", path, token, body);
}

export function apiPut<T>(path: string, body: unknown, token?: string) {
  return request<T>("PUT", path, token, body);
}

export function apiPatch<T>(path: string, body: unknown, token?: string) {
  return request<T>("PATCH", path, token, body);
}

export function apiDelete(path: string, token?: string) {
  return request<void>("DELETE", path, token);
}
