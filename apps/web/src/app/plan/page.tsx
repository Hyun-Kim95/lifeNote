"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { apiGet, apiPut } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type Slot = {
  id: string;
  dayOfWeek: number;
  period: string;
  label: string;
  sortOrder: number;
};

type WeekRes = {
  weekStart: string;
  weekEnd: string;
  slots: Slot[];
};

const emptySlot = { dayOfWeek: 1, period: "morning", label: "", sortOrder: 0 };

export default function PlanPage() {
  const { token } = useAuthToken();
  const [weekStart, setWeekStart] = useState("");
  const [slots, setSlots] = useState([emptySlot]);
  const [data, setData] = useState<WeekRes | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    now.setDate(now.getDate() + diff);
    setWeekStart(now.toISOString().slice(0, 10));
  }, []);

  const load = useCallback(async () => {
    if (!token || !weekStart) return;
    setError(null);
    try {
      const res = await apiGet<WeekRes>(`/v1/plans/weeks/${weekStart}`, token);
      setData(res);
      setSlots(
        res.slots.length
          ? res.slots.map((s) => ({
              dayOfWeek: s.dayOfWeek,
              period: s.period,
              label: s.label,
              sortOrder: s.sortOrder,
            }))
          : [emptySlot],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [token, weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!token) return;
    await apiPut(
      `/v1/plans/weeks/${weekStart}`,
      { slots: slots.filter((s) => s.label.trim()) },
      token,
    );
    await load();
  };

  return (
    <AppShell title="주간 계획" subtitle="월요일 기준으로 주간 슬롯을 저장합니다.">
      <AuthGuard>
      <section className="card p-4">
        <label className="mb-1 block text-sm">weekStart (월요일)</label>
        <input className="input" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          weekEnd: {data?.weekEnd ?? "-"}
        </p>
      </section>

      <section className="card mt-4 p-4">
        <h2 className="mb-3 font-semibold">슬롯</h2>
        {slots.map((slot, idx) => (
          <div key={idx} className="mb-3 grid gap-2 md:grid-cols-4">
            <input
              className="input"
              value={slot.dayOfWeek}
              onChange={(e) => {
                const next = [...slots];
                next[idx].dayOfWeek = Number(e.target.value);
                setSlots(next);
              }}
              placeholder="1~7"
            />
            <select
              className="select"
              value={slot.period}
              onChange={(e) => {
                const next = [...slots];
                next[idx].period = e.target.value;
                setSlots(next);
              }}
            >
              <option value="morning">morning</option>
              <option value="forenoon">forenoon</option>
              <option value="afternoon">afternoon</option>
              <option value="evening">evening</option>
            </select>
            <input
              className="input"
              value={slot.label}
              onChange={(e) => {
                const next = [...slots];
                next[idx].label = e.target.value;
                setSlots(next);
              }}
              placeholder="운동"
            />
            <input
              className="input"
              value={slot.sortOrder}
              onChange={(e) => {
                const next = [...slots];
                next[idx].sortOrder = Number(e.target.value);
                setSlots(next);
              }}
              placeholder="0"
            />
          </div>
        ))}
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setSlots([...slots, emptySlot])}>
            슬롯 추가
          </button>
          <button className="btn" onClick={() => void save()}>
            저장
          </button>
        </div>
        {error ? <p className="mt-2" style={{ color: "#dc2626" }}>{error}</p> : null}
      </section>
      </AuthGuard>
    </AppShell>
  );
}
