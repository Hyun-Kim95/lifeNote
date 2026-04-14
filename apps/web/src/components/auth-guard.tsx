"use client";

import Link from "next/link";
import { useAuthToken } from "@/lib/use-auth-token";

type Role = "user" | "admin";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const { ready, isAuthenticated, user } = useAuthToken();

  if (!ready) {
    return (
      <section className="card p-4 text-sm" style={{ color: "var(--muted)" }}>
        인증 상태를 확인하는 중...
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="card p-4">
        <p className="mb-3 text-sm">로그인이 필요합니다.</p>
        <Link href="/login" className="btn inline-block">
          로그인하러 가기
        </Link>
      </section>
    );
  }

  if (requiredRole === "admin" && user?.role !== "admin") {
    return (
      <section className="card p-4 text-sm" style={{ color: "#dc2626" }}>
        관리자 권한이 필요합니다.
      </section>
    );
  }

  return <>{children}</>;
}
