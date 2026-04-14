"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { ErrorState } from "@/components/ui-states";
import { apiGet } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type Stats = {
  range: "week" | "month" | "year";
  todo: { completionRate: number; completed: number; total: number };
  diary: { daysWritten: number };
  food: { totalSpent: number; budgetAmount: number };
};

export default function StatsPage() {
  const { token } = useAuthToken();
  const [range, setRange] = useState<"week" | "month" | "year">("week");
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      setError(null);
      try {
        const res = await apiGet<Stats>(`/v1/stats/summary?range=${range}`, token);
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    };
    void run();
  }, [token, range]);

  return (
    <AppShell title="통계" subtitle="주/월/년 단위 생활 지표를 확인합니다.">
      <AuthGuard>
      <section className="card p-4">
        <div className="mb-4 flex gap-2">
          {(["week", "month", "year"] as const).map((v) => (
            <button key={v} className="btn" style={{ opacity: range === v ? 1 : 0.7 }} onClick={() => setRange(v)}>
              {v}
            </button>
          ))}
        </div>
        {error ? <ErrorState message={error} /> : null}
        {data ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>할 일 완료율</p>
              <p className="text-xl font-semibold">{Math.round(data.todo.completionRate * 100)}%</p>
              <p className="text-sm">{data.todo.completed}/{data.todo.total}</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>일기 작성일</p>
              <p className="text-xl font-semibold">{data.diary.daysWritten}일</p>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>식비 지출</p>
              <p className="text-xl font-semibold">{data.food.totalSpent.toLocaleString()}원</p>
              <p className="text-sm">예산 {data.food.budgetAmount.toLocaleString()}원</p>
            </div>
          </div>
        ) : null}
      </section>
      </AuthGuard>
    </AppShell>
  );
}
