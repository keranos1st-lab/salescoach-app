"use client";

import Link from "next/link";
import { NavTooltip } from "@/components/nav-tooltip";

const navItems = [
  {
    href: "/dashboard",
    label: "Дашборд",
    tooltip: "Общий обзор: статистика звонков, активность менеджеров",
  },
  {
    href: "/calls",
    label: "Звонки",
    tooltip: "Загружайте сюда записи разговоров менеджеров для анализа",
  },
  {
    href: "/managers",
    label: "Менеджеры",
    tooltip: "Добавьте менеджеров, чтобы видеть статистику по каждому",
  },
  {
    href: "/reports",
    label: "Отчеты",
    tooltip: "Готовые аналитические отчёты по всем звонкам",
  },
  {
    href: "/product",
    label: "Продукт",
    tooltip: "Опишите ваш продукт — это нужно для точного анализа звонков",
    showStartBadge: true,
  },
  { href: "/profile", label: "Профиль" },
] as const;

type Props = {
  activeHref: string;
  productFilled: boolean;
};

export function AppShellNav({ activeHref, productFilled }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      {navItems.map((item) => {
        const active = item.href === activeHref;
        const tooltip = "tooltip" in item ? item.tooltip : null;
        const showStartBadge =
          "showStartBadge" in item && item.showStartBadge && !productFilled;

        return (
          <div
            key={item.href}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition ${
              active ? "bg-[#0d9488]/15" : "hover:bg-zinc-800/80"
            }`}
          >
            <Link
              href={item.href}
              className={`min-w-0 flex-1 rounded-md px-1 py-0.5 text-sm font-medium ${
                active
                  ? "text-[#5eead4]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="flex flex-wrap items-center gap-2">
                {item.label}
                {showStartBadge ? (
                  <span className="badge-start rounded-full bg-[#0d9488]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5eead4]">
                    Начните здесь
                  </span>
                ) : null}
              </span>
            </Link>
            {tooltip ? (
              <NavTooltip hint={tooltip} sectionLabel={item.label} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
