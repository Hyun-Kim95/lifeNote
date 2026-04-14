"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui-states";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type Todo = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  dueOn: string | null;
};

type TodoListRes = {
  items: Todo[];
  stats: { completed: number; total: number };
};

export default function TodosPage() {
  const { token } = useAuthToken();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Todo[]>([]);
  const [stats, setStats] = useState<{ completed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<TodoListRes>("/v1/todos?limit=20", token);
      setItems(res.items);
      setStats(res.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const createTodo = async () => {
    if (!token || !title.trim()) return;
    await apiPost("/v1/todos", { title: title.trim(), priority: "normal" }, token);
    setTitle("");
    await load();
  };

  const toggle = async (todo: Todo) => {
    if (!token) return;
    await apiPatch(`/v1/todos/${todo.id}`, { done: !todo.done }, token);
    await load();
  };

  const remove = async (id: string) => {
    if (!token) return;
    await apiDelete(`/v1/todos/${id}`, token);
    await load();
  };

  return (
    <AppShell title="할 일" subtitle="오늘 할 일을 기록하고 완료 상태를 관리합니다.">
      <AuthGuard>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="card p-4 md:col-span-1">
          <h2 className="mb-3 font-semibold">새 할 일</h2>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="할 일 제목"
          />
          <button className="btn mt-3 w-full" onClick={() => void createTodo()} disabled={!title.trim()}>
            추가
          </button>
        </article>

        <article className="card p-4 md:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">목록</h2>
            {stats ? (
              <span className="badge">
                {stats.completed}/{stats.total} 완료
              </span>
            ) : null}
          </div>
          {loading ? <LoadingState label="할 일 목록을 불러오는 중..." /> : null}
          {error ? <ErrorState message={error} /> : null}
          {!loading && !error && items.length === 0 ? <EmptyState label="등록된 할 일이 없습니다." /> : null}
          <ul className="space-y-2">
            {items.map((todo) => (
              <li key={todo.id} className="flex items-center justify-between rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => void toggle(todo)} className="text-left">
                  <p style={{ textDecoration: todo.done ? "line-through" : "none" }}>{todo.title}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {todo.priority} {todo.dueOn ? `· ${todo.dueOn}` : ""}
                  </p>
                </button>
                <button className="btn btn-secondary" onClick={() => void remove(todo.id)}>
                  삭제
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
      </AuthGuard>
    </AppShell>
  );
}
