"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const PENDING_PLAN_KEY = "salescoach_pending_plan";
const PRICING_LOGIN_URL = `/login?callbackUrl=${encodeURIComponent("/pricing")}`;

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

function redirectToLoginWithPlan(plan: string) {
  sessionStorage.setItem(PENDING_PLAN_KEY, plan);
  window.location.href = PRICING_LOGIN_URL;
}

export function BuyButton({ plan }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const autoStarted = useRef(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await fetch("/api/subscription/status", {
        credentials: "include",
      });
      const status = (await statusRes.json()) as {
        authenticated: boolean;
        plan: string | null;
      };

      if (!status.authenticated) {
        redirectToLoginWithPlan(plan);
        return;
      }

      const targetDbPlan = PLAN_BUTTON_TO_DB[plan];
      if (
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
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as {
        confirmationUrl?: string;
        error?: string;
      };
      if (res.status === 401) {
        redirectToLoginWithPlan(plan);
        return;
      }
      if (res.ok && data.confirmationUrl) {
        sessionStorage.removeItem(PENDING_PLAN_KEY);
        window.location.href = data.confirmationUrl;
        return;
      }
      alert(data.error ?? "Ошибка оплаты");
    } catch {
      alert("Ошибка оплаты");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    const pending = sessionStorage.getItem(PENDING_PLAN_KEY);
    if (pending !== plan || autoStarted.current) return;
    autoStarted.current = true;
    sessionStorage.removeItem(PENDING_PLAN_KEY);
    void handleClick();
  }, [plan, handleClick]);

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
