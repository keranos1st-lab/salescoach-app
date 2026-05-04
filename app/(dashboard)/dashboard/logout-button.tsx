"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function LogoutButton({ compact }: { compact?: boolean }) {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut({ callbackUrl: "/login" });
    setPending(false);
  }

  const base =
    "rounded-lg border border-zinc-700 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50";
  const layout = compact
    ? "px-3 py-2"
    : "w-full px-3 py-2 text-left";

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={pending}
      className={`${base} ${layout}`}
    >
      {pending ? "Выход…" : "Выйти"}
    </button>
  );
}
