"use client";

import Link from "next/link";

export function GuestAuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/80"
      >
        Войти
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-[#0d9488] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#0f766e]"
      >
        Регистрация
      </Link>
    </div>
  );
}
