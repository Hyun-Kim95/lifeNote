import { useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getApiBaseUrl } from '../config';

function parseErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const err = (body as { error?: unknown }).error;
  if (!err || typeof err !== 'object') return null;
  const msg = (err as { message?: unknown }).message;
  return typeof msg === 'string' ? msg : null;
}

export type ApiOptions = {
  /** 기본 true. 공개 API만 false */
  auth?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export function useApi() {
  const { getAccessTokenForApi, forceRefreshTokens, signOut } = useAuth();
  const base = getApiBaseUrl();

  const requestJson = useCallback(
    async <T>(path: string, options: ApiOptions = {}): Promise<T> => {
      const auth = options.auth !== false;
      const method = options.method ?? 'GET';
      const headers: Record<string, string> = {};
      if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
      }

      const exec = async (token: string | null) => {
        if (auth && token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(`${base}${path}`, {
          method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: options.signal,
        });
        const text = await res.text();
        let parsed: unknown = text;
        try {
          parsed = text ? JSON.parse(text) : {};
        } catch {
          parsed = { raw: text };
        }
        return { res, parsed };
      };

      let token: string | null = auth ? await getAccessTokenForApi() : null;
      let { res, parsed } = await exec(token);

      if (res.status === 401 && auth) {
        const refreshed = await forceRefreshTokens();
        if (refreshed) {
          ({ res, parsed } = await exec(refreshed));
        } else {
          await signOut();
        }
      }

      if (!res.ok) {
        const msg = parseErrorMessage(parsed) ?? `${res.status} ${res.statusText}`;
        throw new Error(msg);
      }
      return parsed as T;
    },
    [base, getAccessTokenForApi, forceRefreshTokens, signOut],
  );

  return { requestJson, base };
}
