"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export function PaymentToast() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl bg-teal-600 px-5 py-3.5 shadow-lg">
        <span className="text-xl">🎉</span>
        <div>
          <p className="text-sm font-semibold text-white">Тариф успешно подключён!</p>
          <p className="text-xs text-teal-100">Теперь вам доступны все возможности выбранного плана</p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="ml-2 text-teal-200 hover:text-white transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
