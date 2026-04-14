"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/app-shell";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export default function LoginPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback`;
  }, []);

  const startGoogleLogin = () => {
    if (!clientId || !redirectUri) return;

    const q = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });

    window.location.href = `${GOOGLE_AUTH_URL}?${q.toString()}`;
  };

  return (
    <AppShell title="로그인" subtitle="Google 계정으로 로그인하세요.">
      <section className="card mx-auto max-w-[480px] p-6">
        {!clientId ? (
          <p style={{ color: "#dc2626" }}>
            NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않아 로그인 버튼을 사용할 수 없습니다.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
              로그인 후 자동으로 서비스로 돌아옵니다.
            </p>
            <button className="btn w-full" onClick={startGoogleLogin}>
              Google로 로그인
            </button>
          </>
        )}
      </section>
    </AppShell>
  );
}
