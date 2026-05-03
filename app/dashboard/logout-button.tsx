"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

export function LogoutButton() {
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut({ redirectUrl: "/login" });
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogout()}
      disabled={pending}
      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50"
    >
      {pending ? "Выход…" : "Выйти"}
    </button>
  );
}
