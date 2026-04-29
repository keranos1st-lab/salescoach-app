"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "salescoach-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY, nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"
      }
      className="rounded-full border border-zinc-700 bg-zinc-900/90 p-2.5 text-xl leading-none text-zinc-100 shadow-lg shadow-black/30 backdrop-blur transition-all duration-300 hover:border-teal-500/60 hover:text-teal-300"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
