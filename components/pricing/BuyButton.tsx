"use client";

import { useState } from "react";

type BuyButtonProps = {
  plan: string;
};

export function BuyButton({ plan }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as {
        confirmationUrl?: string;
        error?: string;
      };
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
      onClick={handleClick}
      className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Оформление..." : "Подключить"}
    </button>
  );
}
