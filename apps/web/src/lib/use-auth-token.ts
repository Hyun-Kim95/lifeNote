"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearSession,
  readSession,
  refreshSession,
  writeSession,
  type AuthTokenResponse,
  type AuthUser,
} from "@/lib/auth-session";

export function useAuthToken() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const loadSession = useCallback(async () => {
    const session = readSession();
    if (!session) {
      setToken("");
      setUser(null);
      setReady(true);
      return;
    }

    if (session.expiresAt <= Date.now()) {
      try {
        const refreshed = await refreshSession(session.refreshToken);
        saveTokenResponse(refreshed);
        setToken(refreshed.accessToken);
        setUser(refreshed.user);
      } catch {
        clearSession();
        setToken("");
        setUser(null);
      } finally {
        setReady(true);
      }
      return;
    }

    setToken(session.accessToken);
    setUser(session.user);
    setReady(true);
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const saveTokenResponse = (response: AuthTokenResponse) => {
    writeSession(response);
  };

  const signIn = (response: AuthTokenResponse) => {
    saveTokenResponse(response);
    setToken(response.accessToken);
    setUser(response.user);
  };

  const signOut = () => {
    clearSession();
    setToken("");
    setUser(null);
  };

  const isAuthenticated = useMemo(() => !!token, [token]);

  return { token, user, ready, isAuthenticated, signIn, signOut, reloadSession: loadSession };
}
