"use client";

import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-50"
    >
      {pending ? "Выход…" : "Выйти"}
    </button>
  );
}
