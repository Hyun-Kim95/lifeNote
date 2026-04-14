"use client";

import { useEffect, useState } from "react";
import {
  type Theme,
  applyTheme,
  getStoredTheme,
  resolveTheme,
} from "@/lib/theme";

type Props = {
  className?: string;
};

export function ThemeToggle({ className }: Props) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const fromDom = document.documentElement.getAttribute("data-theme");
    let t: Theme;
    if (fromDom === "dark" || fromDom === "light") {
      t = fromDom;
    } else {
      t = resolveTheme();
      applyTheme(t);
    }
    setTheme(t);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (getStoredTheme() !== null) return;
      const next = mq.matches ? "dark" : "light";
      applyTheme(next);
      setTheme(next);
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = () => {
    const current = theme ?? resolveTheme();
    const next: Theme = current === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  const label =
    (theme ?? resolveTheme()) === "dark" ? "라이트 모드" : "다크 모드";

  return (
    <button
      type="button"
      className={className ?? "theme-toggle"}
      onClick={toggle}
      aria-pressed={(theme ?? resolveTheme()) === "dark"}
    >
      {label}
    </button>
  );
}
