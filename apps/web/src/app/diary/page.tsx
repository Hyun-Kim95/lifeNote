"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { EmptyState } from "@/components/ui-states";
import { apiGet, apiPut } from "@/lib/api";
import { useAuthToken } from "@/lib/use-auth-token";

type TemplateRes = { items: Array<{ id: string; name: string }> };

type Diary = {
  id: string;
  date: string;
  templateId: string | null;
  title: string | null;
  body: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DiaryPage() {
  const { token } = useAuthToken();
  const [date, setDate] = useState(today());
  const [templates, setTemplates] = useState<TemplateRes>({ items: [] });
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const t = await apiGet<TemplateRes>("/v1/diary-templates");
        setTemplates(t);
      } catch {
        setTemplates({ items: [] });
      }
    };
    void run();
  }, []);

  const loadDiary = useCallback(async () => {
    if (!token) return;
    setMsg(null);
    try {
      const d = await apiGet<Diary>(`/v1/diaries/${date}`, token);
      setTemplateId(d.templateId ?? "");
      setTitle(d.title ?? "");
      setBody(d.body);
    } catch {
      setTitle("");
      setBody("");
      setMsg("해당 날짜의 일기가 없어 새로 작성합니다.");
    }
  }, [date, token]);

  useEffect(() => {
    void loadDiary();
  }, [loadDiary]);

  const save = async () => {
    if (!token) return;
    await apiPut(`/v1/diaries/${date}`, { templateId: templateId || undefined, title, body }, token);
    setMsg("저장되었습니다.");
  };

  return (
    <AppShell title="일기" subtitle="날짜별 일기를 작성하고 수정합니다.">
      <AuthGuard>
      <section className="card p-4">
        <label className="mb-1 block text-sm">날짜</label>
        <input className="input" value={date} onChange={(e) => setDate(e.target.value)} />

        <label className="mb-1 mt-3 block text-sm">템플릿</label>
        <select className="select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          <option value="">선택 안 함</option>
          {templates.items.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <label className="mb-1 mt-3 block text-sm">제목</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="mb-1 mt-3 block text-sm">본문</label>
        <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} />
        {!body.trim() ? <EmptyState label="본문을 입력해 주세요." /> : null}

        <button className="btn mt-3" onClick={() => void save()} disabled={!body.trim()}>
          저장
        </button>
        {msg ? <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{msg}</p> : null}
      </section>
      </AuthGuard>
    </AppShell>
  );
}
