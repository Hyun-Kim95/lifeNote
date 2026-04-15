import * as SecureStore from 'expo-secure-store';

const K_ACCESS = 'lifenote_access_token';
const K_REFRESH = 'lifenote_refresh_token';
const K_EXPIRES = 'lifenote_access_expires_at_ms';

export type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
};

export async function loadSession(): Promise<StoredSession | null> {
  const accessToken = await SecureStore.getItemAsync(K_ACCESS);
  const refreshToken = await SecureStore.getItemAsync(K_REFRESH);
  const expRaw = await SecureStore.getItemAsync(K_EXPIRES);
  if (!accessToken || !refreshToken || !expRaw) return null;
  const expiresAtMs = Number(expRaw);
  if (!Number.isFinite(expiresAtMs)) return null;
  return { accessToken, refreshToken, expiresAtMs };
}

export async function saveSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(K_ACCESS, session.accessToken);
  await SecureStore.setItemAsync(K_REFRESH, session.refreshToken);
  await SecureStore.setItemAsync(K_EXPIRES, String(session.expiresAtMs));
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(K_ACCESS);
  await SecureStore.deleteItemAsync(K_REFRESH);
  await SecureStore.deleteItemAsync(K_EXPIRES);
}

export function computeExpiresAtMs(expiresInSec: number): number {
  return Date.now() + Math.max(30, expiresInSec) * 1000;
}
