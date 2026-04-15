import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getApiBaseUrl } from '../config';
import {
  clearSession,
  computeExpiresAtMs,
  loadSession,
  saveSession,
  type StoredSession,
} from './tokenStorage';

export type AuthUser = {
  id: string;
  displayName: string | null;
  role: string;
};

export type AuthTokenResponse = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  tokenType: string;
  user: AuthUser;
};

type AuthContextValue = {
  ready: boolean;
  session: StoredSession | null;
  user: AuthUser | null;
  signInFromExchange: (payload: AuthTokenResponse) => Promise<void>;
  signInManualTokens: (accessToken: string, refreshToken: string, expiresInSec?: number) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessTokenForApi: () => Promise<string | null>;
  forceRefreshTokens: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function parseErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const err = (body as { error?: unknown }).error;
  if (!err || typeof err !== 'object') return null;
  const msg = (err as { message?: unknown }).message;
  return typeof msg === 'string' ? msg : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const s = await loadSession();
        setSession(s);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const signInFromExchange = useCallback(async (payload: AuthTokenResponse) => {
    const expiresAtMs = computeExpiresAtMs(payload.expiresIn);
    const next: StoredSession = {
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      expiresAtMs,
    };
    await saveSession(next);
    setSession(next);
    setUser(payload.user);
  }, []);

  const signInManualTokens = useCallback(
    async (accessToken: string, refreshToken: string, expiresInSec = 3600) => {
      const expiresAtMs = computeExpiresAtMs(expiresInSec);
      const next: StoredSession = { accessToken, refreshToken, expiresAtMs };
      await saveSession(next);
      setSession(next);
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/v1/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = {};
      }
      if (!res.ok) {
        await clearSession();
        setSession(null);
        setUser(null);
        throw new Error(parseErrorMessage(parsed) ?? '프로필을 불러오지 못했습니다.');
      }
      const me = parsed as {
        id: string;
        displayName: string | null;
        role: string;
      };
      setUser({ id: me.id, displayName: me.displayName, role: me.role });
    },
    [],
  );

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
    setUser(null);
  }, []);

  const refreshAccessToken = useCallback(async (current: StoredSession): Promise<string | null> => {
    const base = getApiBaseUrl();
    const res = await fetch(`${base}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = {};
    }
    if (!res.ok) {
      await clearSession();
      setSession(null);
      setUser(null);
      return null;
    }
    const body = parsed as AuthTokenResponse;
    const next: StoredSession = {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresAtMs: computeExpiresAtMs(body.expiresIn),
    };
    await saveSession(next);
    setSession(next);
    if (body.user) setUser(body.user);
    return next.accessToken;
  }, []);

  const forceRefreshTokens = useCallback(async (): Promise<string | null> => {
    const s = await loadSession();
    if (!s) return null;
    return refreshAccessToken(s);
  }, [refreshAccessToken]);

  const getAccessTokenForApi = useCallback(async (): Promise<string | null> => {
    const s = session;
    if (!s) return null;
    const skewMs = 60_000;
    if (s.expiresAtMs > Date.now() + skewMs) {
      return s.accessToken;
    }
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }
    const p = (async () => {
      try {
        return await refreshAccessToken(s);
      } finally {
        refreshPromiseRef.current = null;
      }
    })();
    refreshPromiseRef.current = p;
    return p;
  }, [session, refreshAccessToken]);

  const value = useMemo(
    () => ({
      ready,
      session,
      user,
      signInFromExchange,
      signInManualTokens,
      signOut,
      getAccessTokenForApi,
      forceRefreshTokens,
    }),
    [
      ready,
      session,
      user,
      signInFromExchange,
      signInManualTokens,
      signOut,
      getAccessTokenForApi,
      forceRefreshTokens,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
