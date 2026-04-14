"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuthToken } from "@/lib/use-auth-token";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/admin", label: "관리자" },
];

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated, signOut } = useAuthToken();

  return (
    <div className="app-shell">
      <header className="card mx-auto mt-4 w-[min(1120px,95%)] p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="page-title font-semibold">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm leading-6" style={{ color: "var(--muted)" }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <span className="badge">{user?.displayName ?? "사용자"}</span>
                <button className="btn btn-secondary" onClick={signOut}>
                  로그아웃
                </button>
              </>
            ) : (
              <Link href="/login" className="btn">
                로그인
              </Link>
            )}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 pt-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: active ? "var(--primary)" : "var(--border)",
                  background: active ? "var(--primary)" : "transparent",
                  color: active ? "#fff" : "inherit",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto my-4 w-[min(1120px,95%)]">{children}</main>
    </div>
  );
}
