export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export type AuthUser = {
  id: string;
  displayName: string | null;
  role: "user" | "admin";
};

export type AuthTokenResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  tokenType: "Bearer";
  user: AuthUser;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

const STORAGE_KEY = "lifenote_auth_session";

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(tokens: AuthTokenResponse) {
  if (typeof window === "undefined") return;
  const expiresAt = Date.now() + Math.max(1, tokens.expiresIn - 30) * 1000;
  const session: StoredSession = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt,
    user: tokens.user,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function refreshSession(refreshToken: string): Promise<AuthTokenResponse> {
  const res = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const payload = (await safeJson(res)) as
    | { error?: { message?: string } }
    | AuthTokenResponse
    | null;

  if (!res.ok) {
    throw new Error(
      (payload as { error?: { message?: string } } | null)?.error?.message ??
        `API ${res.status} ${res.statusText}`,
    );
  }

  return payload as AuthTokenResponse;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
