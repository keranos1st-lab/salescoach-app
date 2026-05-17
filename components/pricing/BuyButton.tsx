"use client";

import { useState } from "react";

const PROFILE_PLANS_URL = "/profile?open=plans";
const LOGIN_URL = `/login?callbackUrl=${encodeURIComponent(PROFILE_PLANS_URL)}`;

type BuyButtonProps = {
  plan: string;
};

export function BuyButton({ plan: _plan }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const statusRes = await fetch("/api/subscription/status", {
        credentials: "include",
      });
      const status = (await statusRes.json()) as { authenticated: boolean };
      window.location.href = status.authenticated ? PROFILE_PLANS_URL : LOGIN_URL;
    } catch {
      window.location.href = LOGIN_URL;
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void handleClick()}
      className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Переход…" : "Подключить"}
    </button>
  );
}
