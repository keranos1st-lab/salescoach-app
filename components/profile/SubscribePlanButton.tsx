"use client";

import { useState } from "react";

type SubscribePlanButtonProps = {
  plan: string;
  isCurrent: boolean;
};

export function SubscribePlanButton({ plan, isCurrent }: SubscribePlanButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (isCurrent) {
      alert("Это уже ваш текущий тариф");
      return;
    }

    setLoading(true);
    try {
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
        alert("Сессия истекла. Войдите снова.");
        window.location.href = `/login?callbackUrl=${encodeURIComponent("/profile?open=plans")}`;
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
      disabled={loading || isCurrent}
      onClick={() => void handleClick()}
      className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Оформление..." : isCurrent ? "Текущий тариф" : "Выбрать"}
    </button>
  );
}
