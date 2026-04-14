"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { API_BASE_URL } from "@/lib/api";
import { type AuthTokenResponse } from "@/lib/auth-session";
import { useAuthToken } from "@/lib/use-auth-token";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { signIn } = useAuthToken();
  const [message, setMessage] = useState("로그인 처리 중...");
  const exchangeStartedRef = useRef(false);

  const redirectUri = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback`;
  }, []);

  useEffect(() => {
    const run = async () => {
      // React Strict Mode(dev)에서 effect가 2회 실행될 수 있어
      // 동일 authorizationCode 교환을 한 번만 수행한다.
      if (exchangeStartedRef.current) return;
      exchangeStartedRef.current = true;

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setMessage(`로그인 실패: ${error}`);
        return;
      }

      if (!code || !redirectUri) {
        setMessage("인가 코드가 없어 로그인을 완료할 수 없습니다.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/v1/auth/oauth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "google",
            authorizationCode: code,
            redirectUri,
          }),
        });

        const payload = (await res.json()) as
          | AuthTokenResponse
          | { error?: { message?: string } };

        if (!res.ok) {
          throw new Error(payload && "error" in payload ? payload.error?.message ?? "로그인 실패" : "로그인 실패");
        }

        signIn(payload as AuthTokenResponse);
        setMessage("로그인 성공. 홈으로 이동합니다.");
        router.replace("/");
      } catch (e) {
        setMessage(e instanceof Error ? e.message : "로그인 실패");
      }
    };

    void run();
  }, [redirectUri, router, signIn]);

  return (
    <AppShell title="로그인 콜백" subtitle="인증을 완료하고 있습니다.">
      <section className="card mx-auto max-w-[480px] p-6">
        <p>{message}</p>
      </section>
    </AppShell>
  );
}
