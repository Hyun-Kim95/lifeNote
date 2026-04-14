import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Root() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--background)",
        padding: 24,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <section className="card" style={{ maxWidth: 520, width: "100%", padding: 28 }}>
        <h1 className="page-title" style={{ marginTop: 0 }}>lifeNote Admin</h1>
        <p style={{ color: "var(--muted)", marginBottom: 20 }}>
          관리자 운영 화면을 사용하려면 로그인 후 관리자 권한 계정으로 접근하세요.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/admin" className="btn">관리자 화면으로 이동</Link>
          <Link href="/login" className="btn btn-secondary">로그인</Link>
        </div>
      </section>
    </main>
  );
}
