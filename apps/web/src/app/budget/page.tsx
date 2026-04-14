"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { EmptyState, ErrorState } from "@/components/ui-states";
import { apiGet, apiPut } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type MonthRes = { yearMonth: string; budgetAmount: number; spentAmount: number; remainingAmount: number };
type DaysRes = { items: Array<{ date: string; amount: number; memo?: string | null }> };

function thisMonth() {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  return `${y}-${m}`;
}

export default function BudgetPage() {
  const { token } = useAuthToken();
  const [yearMonth, setYearMonth] = useState(thisMonth());
  const [budgetAmount, setBudgetAmount] = useState("400000");
  const [day, setDay] = useState("");
  const [amount, setAmount] = useState("0");
  const [memo, setMemo] = useState("");
  const [month, setMonth] = useState<MonthRes | null>(null);
  const [days, setDays] = useState<DaysRes | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [m, d] = await Promise.all([
        apiGet<MonthRes>(`/v1/budgets/food/months/${yearMonth}`, token),
        apiGet<DaysRes>(`/v1/budgets/food/months/${yearMonth}/days`, token),
      ]);
      setMonth(m);
      setDays(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [token, yearMonth]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMonth = async () => {
    if (!token) return;
    await apiPut(`/v1/budgets/food/months/${yearMonth}`, { budgetAmount: Number(budgetAmount) }, token);
    await load();
  };

  const saveDay = async () => {
    if (!token || !day) return;
    await apiPut(`/v1/budgets/food/months/${yearMonth}/days/${day}`, { amount: Number(amount), memo }, token);
    setMemo("");
    await load();
  };

  const totalSpent = useMemo(() => month?.spentAmount ?? 0, [month]);

  return (
    <AppShell title="식비 가계부" subtitle="월 예산과 일별 지출을 관리합니다.">
      <AuthGuard>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-4">
          <h2 className="mb-3 font-semibold">월 예산</h2>
          <label className="mb-1 block text-sm">연월</label>
          <input className="input" value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} placeholder="YYYY-MM" />
          <label className="mb-1 mt-3 block text-sm">예산(원)</label>
          <input className="input" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} />
          <button className="btn mt-3" onClick={() => void saveMonth()}>
            월 예산 저장
          </button>
          {month ? (
            <div className="mt-3 space-y-1 text-sm">
              <p>사용: {totalSpent.toLocaleString()}원</p>
              <p>잔액: {month.remainingAmount.toLocaleString()}원</p>
            </div>
          ) : null}
        </article>

        <article className="card p-4">
          <h2 className="mb-3 font-semibold">일별 지출</h2>
          <label className="mb-1 block text-sm">날짜</label>
          <input className="input" value={day} onChange={(e) => setDay(e.target.value)} placeholder={`${yearMonth}-01`} />
          <label className="mb-1 mt-3 block text-sm">금액(원)</label>
          <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label className="mb-1 mt-3 block text-sm">메모</label>
          <input className="input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="점심" />
          <button className="btn mt-3" onClick={() => void saveDay()} disabled={!day}>
            일별 저장
          </button>
        </article>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="mb-3 font-semibold">지출 목록</h2>
        {error ? <ErrorState message={error} /> : null}
        {!error && !days?.items?.length ? <EmptyState label="기록된 지출이 없습니다." /> : null}
        <ul className="space-y-2">
          {days?.items?.map((it) => (
            <li key={it.date} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
              <p>{it.date}</p>
              <p>{it.amount.toLocaleString()}원</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>{it.memo ?? ""}</p>
            </li>
          ))}
        </ul>
      </section>
      </AuthGuard>
    </AppShell>
  );
}
