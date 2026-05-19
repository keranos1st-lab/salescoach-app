"use client";

import type { RiskMapResponse } from "@/app/api/dashboard/risk-map/route";
import { useCallback, useEffect, useState } from "react";

type SelectedCell = {
  manager: string;
  riskLabel: string;
  count: number;
  dates: string[];
};

function cellTone(count: number): string {
  if (count <= 0) {
    return "bg-zinc-900/20 text-zinc-500";
  }
  if (count <= 2) {
    return "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25";
  }
  return "bg-red-500/20 text-red-200 ring-1 ring-red-500/30";
}

function RiskMapSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-48 rounded bg-zinc-800" />
      <div className="h-64 rounded-2xl bg-zinc-800/60" />
    </div>
  );
}

export function RiskMap() {
  const [data, setData] = useState<RiskMapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedCell | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/risk-map");
      const json = (await res.json()) as RiskMapResponse & { error?: string };
      if (!res.ok) {
        setError(json.error || "Не удалось загрузить карту рисков");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Ошибка сети");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-zinc-100">
        Карта рисков команды · последние 30 дней
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Какие типовые ошибки встречаются у менеджеров по разборам звонков
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        {loading ? (
          <RiskMapSkeleton />
        ) : error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : !data?.has_data || data.risks.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            Нет данных. Сгенерируйте отчёты по менеджерам за текущий период.
          </p>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="-mx-2 min-w-0 flex-1 overflow-x-auto px-2">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-zinc-900/95 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Риск
                    </th>
                    {data.managers.map((name) => (
                      <th
                        key={name}
                        className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400"
                      >
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.risks.map((risk) => (
                    <tr key={risk.risk_id} className="border-t border-zinc-800/80">
                      <td className="sticky left-0 z-10 max-w-[200px] bg-zinc-900/95 px-3 py-2.5 text-left text-zinc-200">
                        {risk.label}
                      </td>
                      {data.managers.map((manager) => {
                        const count = risk.mentions[manager] ?? 0;
                        const dates =
                          risk.mention_dates[manager]?.dates ?? [];
                        const isSelected =
                          selected?.manager === manager &&
                          selected?.riskLabel === risk.label;

                        return (
                          <td key={`${risk.risk_id}-${manager}`} className="px-2 py-2">
                            <button
                              type="button"
                              disabled={count === 0}
                              onClick={() =>
                                setSelected({
                                  manager,
                                  riskLabel: risk.label,
                                  count,
                                  dates,
                                })
                              }
                              className={`flex h-10 w-full min-w-[3rem] items-center justify-center gap-1 rounded-lg text-sm font-semibold tabular-nums transition ${cellTone(count)} ${
                                count > 0
                                  ? "cursor-pointer hover:brightness-110"
                                  : "cursor-default"
                              } ${isSelected ? "ring-2 ring-[#0d9488]" : ""}`}
                              title={
                                count > 0
                                  ? `${manager} · ${risk.label} · ${count}`
                                  : undefined
                              }
                            >
                              {count > 0 ? count : "—"}
                              {count >= 3 ? (
                                <span className="text-xs" aria-hidden>
                                  ⚠️
                                </span>
                              ) : null}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected ? (
              <aside className="w-full shrink-0 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 lg:w-72">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5eead4]">
                  Детали
                </p>
                <p className="mt-2 text-sm font-medium text-zinc-100">
                  {selected.manager} · {selected.riskLabel}
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  {selected.count}{" "}
                  {selected.count === 1
                    ? "упоминание"
                    : selected.count < 5
                      ? "упоминания"
                      : "упоминаний"}{" "}
                  в разборах звонков
                </p>
                {selected.dates.length > 0 ? (
                  <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-xs text-zinc-400">
                    {selected.dates.map((date) => (
                      <li key={date}>
                        {new Date(date).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-4 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  Закрыть
                </button>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
