"use client";

export function LoadingState({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="card p-4 text-sm" style={{ color: "var(--muted)" }}>
      {label}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="card p-4 text-sm" style={{ color: "var(--muted)" }}>
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="card p-4 text-sm" style={{ color: "#dc2626" }}>
      {message}
    </div>
  );
}
