"use client";

import { useState } from "react";

type BuyButtonProps = {
  plan: string;
};

/** UI plan key → Prisma `Plan` enum (same as payments route). */
const PLAN_BUTTON_TO_DB: Record<string, string> = {
  STARTER: "START",
  STANDARD: "STANDARD",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
};

export function BuyButton({ plan }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const statusRes = await fetch("/api/subscription/status", {
        credentials: "include",
      });
      const status = (await statusRes.json()) as {
        authenticated: boolean;
        plan: string | null;
      };

      const targetDbPlan = PLAN_BUTTON_TO_DB[plan];
      if (
        status.authenticated &&
        status.plan &&
        targetDbPlan &&
        status.plan === targetDbPlan
      ) {
        alert("Это уже ваш текущий тариф");
        return;
      }

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as {
        confirmationUrl?: string;
        error?: string;
      };
      if (res.status === 401) {
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/pricing")}`;
        return;
      }
      if (res.ok && data.confirmationUrl) {
        window.location.href = data.confirmationUrl;
        return;
      }
      alert(data.error ?? "Ошибка оплаты");
    } catch {
      alert("Ошибка оплаты");
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
      {loading ? "Оформление..." : "Подключить"}
    </button>
  );
}
