"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ONBOARDING_DISMISSED_KEY } from "@/lib/onboarding-storage";

type Props = {
  /** С сервера: анкета продукта ещё не заполнена */
  showWhenProductEmpty: boolean;
};

export function WelcomeOnboardingBanner({ showWhenProductEmpty }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!showWhenProductEmpty) {
      setVisible(false);
      return;
    }
    try {
      const dismissed =
        localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1";
      setVisible(!dismissed);
    } catch {
      setVisible(showWhenProductEmpty);
    }
  }, [showWhenProductEmpty]);

  function dismiss() {
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="welcome-onboarding-banner relative shrink-0 border-b border-[#0d9488]/30 bg-[#0d9488]/10 px-6 py-4"
      role="region"
      aria-label="Приветствие"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 pr-8 sm:pr-0">
          <h2 className="text-base font-semibold text-zinc-100">
            Добро пожаловать! Начните с описания продукта
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Чтобы ИИ точно анализировал ваши звонки, сначала расскажите о своём
            продукте и компании. Это займёт 2 минуты.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/product"
              className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#0f766e]"
              onClick={dismiss}
            >
              Заполнить продукт →
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/80"
            >
              Пропустить
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 rounded p-1 text-zinc-500 transition hover:bg-zinc-800/80 hover:text-zinc-300 sm:static sm:shrink-0"
          aria-label="Закрыть"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
