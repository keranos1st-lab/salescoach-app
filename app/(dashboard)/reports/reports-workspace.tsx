"use client";

import { inferRiskIdFromText } from "@/lib/report-risks";
import { useMemo, useRef, useState } from "react";
import type { ReportManager } from "./page";

type RangePreset = "week" | "month" | "custom";

type ReportRiskItem = {
  risk_id: string;
  text: string;
};

type ManagerRiskAction = {
  risk_id: string;
  risk: string;
  actions: string[];
};

type ReportPayload = {
  average_score: number | null;
  period_score: number | null;
  summary: string;
  strengths: string[];
  weaknesses: ReportRiskItem[];
  coaching_focus: string[];
  skill_breakdown: {
    key: string;
    label: string;
    status: "strong" | "ok" | "risk" | "no_data";
    value: number | null;
    comment: string;
  }[];
  repeated_patterns: ReportRiskItem[];
  manager_notes: string[];
  manager_risk_actions?: Record<string, ManagerRiskAction[]>;
  managerName: string;
  callsCount: number;
  analyzedCallsCount: number;
  from: string;
  to: string;
};

function toInputDate(date: Date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function ReportsWorkspace({ managers }: { managers: ReportManager[] }) {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [managerId, setManagerId] = useState("");
  const [preset, setPreset] = useState<RangePreset>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string>("");

  const period = useMemo(() => {
    const today = startOfToday();
    if (preset === "week") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toInputDate(from), to: toInputDate(today) };
    }
    if (preset === "month") {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: toInputDate(from), to: toInputDate(today) };
    }
    return { from: customFrom, to: customTo };
  }, [preset, customFrom, customTo]);

  const canGenerate =
    Boolean(managerId) &&
    Boolean(period.from) &&
    Boolean(period.to) &&
    !loading &&
    (!period.from || !period.to || period.from <= period.to);

  async function generateReport() {
    if (!canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerId,
          from: period.from,
          to: period.to,
        }),
      });
      const json = (await res.json()) as { error?: string; report?: ReportPayload };
      if (!res.ok || !json.report) {
        setError(json.error || "Не удалось сгенерировать отчёт");
        return;
      }
      setReport(json.report);
      if (process.env.NODE_ENV === "development") {
        console.log("[reports-workspace] report payload:", {
          weaknesses: json.report.weaknesses,
          repeated_patterns: json.report.repeated_patterns,
          manager_risk_actions: json.report.manager_risk_actions,
          managerName: json.report.managerName,
        });
      }
      setGeneratedAt(new Date().toLocaleString("ru-RU"));
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    const selectedManagerName =
      report?.managerName ||
      managers.find((m) => m.id === managerId)?.name ||
      "Менеджер";
    const managerName = selectedManagerName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Zа-яА-ЯёЁ0-9_]/g, "");
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;
    const originalTitle = document.title;
    document.title = `Отчёт_${managerName}_${date}`;

    const cleanup = () => {
      document.body.classList.remove("printing");
      document.title = originalTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    document.body.classList.add("printing");
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Fallback for browsers where afterprint may not fire reliably.
    setTimeout(() => {
      if (document.body.classList.contains("printing")) {
        cleanup();
      }
    }, 1000);
  }


  return (
    <div className="report-workspace-screen mx-auto w-full max-w-5xl space-y-8">
      <header className="no-print">
        <h1 className="text-2xl font-semibold tracking-tight">Отчеты по менеджерам</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Выберите менеджера и период, чтобы получить управленческий отчёт
        </p>
      </header>

      <section className="report-form no-print rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="report-manager" className="text-sm font-medium text-zinc-300">
              Менеджер
            </label>
            <select
              id="report-manager"
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25"
            >
              <option value="">Выберите менеджера</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-zinc-300">Период</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset("week")}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  preset === "week"
                    ? "border-[#0d9488] bg-[#0d9488]/15 text-[#5eead4]"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Неделя
              </button>
              <button
                type="button"
                onClick={() => setPreset("month")}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  preset === "month"
                    ? "border-[#0d9488] bg-[#0d9488]/15 text-[#5eead4]"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Месяц
              </button>
              <button
                type="button"
                onClick={() => setPreset("custom")}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  preset === "custom"
                    ? "border-[#0d9488] bg-[#0d9488]/15 text-[#5eead4]"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                Диапазон
              </button>
            </div>
          </div>
        </div>

        {preset === "custom" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="from-date" className="text-sm font-medium text-zinc-300">
                С даты
              </label>
              <input
                id="from-date"
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="to-date" className="text-sm font-medium text-zinc-300">
                По дату
              </label>
              <input
                id="to-date"
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25"
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            Выбран период: {period.from} — {period.to}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canGenerate}
            onClick={generateReport}
            className="rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d9488]/25 transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Генерация..." : "Сгенерировать отчёт"}
          </button>
        </div>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </section>

      {report ? (
        <section className="report-output space-y-4 print:space-y-3">
          <div className="no-print flex justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden
              >
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <path d="M6 14h12v8H6z" />
              </svg>
              Скачать PDF
            </button>
          </div>

          <div id="print-report" ref={reportRef}>
            <article className="report-article space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 print:space-y-4 print:border-zinc-700 print:bg-white print:text-black">
              <header className="report-pdf-cover hidden print:block">
                <p className="report-pdf-cover__brand">SalesCoach</p>
                <p className="report-pdf-cover__title">Управленческий отчёт</p>
                <div className="report-pdf-cover__meta">
                  <p>Менеджер: {report.managerName}</p>
                  <p>
                    Период: {report.from} — {report.to}
                  </p>
                  <p>Сформирован: {generatedAt || "—"}</p>
                </div>
              </header>

              <h2 className="text-xl font-semibold print:hidden">
                Управленческий отчёт по менеджеру
              </h2>

              <section className="report-section report-screen-meta rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 print:border-zinc-300 print:bg-zinc-100">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 print:text-zinc-700">
                  Шапка отчёта
                </h3>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 print:grid-cols-2">
                  <ReportMeta label="Менеджер" value={report.managerName} />
                  <ReportMeta label="Период" value={`${report.from} — ${report.to}`} />
                  <ReportMeta
                    label="Количество звонков"
                    value={`${report.callsCount} (с анализом: ${report.analyzedCallsCount})`}
                  />
                  <ReportMeta label="Дата формирования" value={generatedAt || "—"} />
                </div>
              </section>

              <section className="report-section report-summary-section rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 print:border-zinc-300 print:bg-zinc-100">
                <h3 className="report-section-title text-xs font-semibold uppercase tracking-wide text-zinc-400 print:text-zinc-700">
                  Главный summary
                </h3>
                <div className="report-kpi-grid mt-3 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
                  <ReportKpi label="average_score" value={report.average_score} />
                  <ReportKpi label="period_score" value={report.period_score} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-200 print:text-zinc-900">
                  {report.summary || "—"}
                </p>
              </section>

              <ReportListBlock title="Сильные стороны" items={report.strengths} />
              <RiskListWithActions
                title="Слабые зоны"
                items={report.weaknesses}
                managerName={report.managerName}
                riskActions={report.manager_risk_actions}
              />
              <ReportListBlock title="Фокус коучинга" items={report.coaching_focus} />
              <SkillBreakdownBlock items={report.skill_breakdown} />
              <RiskListWithActions
                title="Повторяющиеся паттерны"
                items={report.repeated_patterns}
                managerName={report.managerName}
                riskActions={report.manager_risk_actions}
              />
              <ReportListBlock
                title="Заметки для руководителя"
                items={report.manager_notes}
                className="report-manager-notes"
              />
            </article>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function getManagerRiskEntries(
  map: Record<string, ManagerRiskAction[]> | undefined,
  managerName: string,
): ManagerRiskAction[] {
  if (!map || !managerName) return [];
  if (map[managerName]?.length) return map[managerName];
  const key = Object.keys(map).find(
    (k) => k.toLowerCase() === managerName.toLowerCase(),
  );
  return key ? (map[key] ?? []) : [];
}

function buildActionsByRiskId(
  ...lists: ManagerRiskAction[][]
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const entries of lists) {
    for (const entry of entries) {
      if (!entry.risk_id || entry.actions.length === 0) continue;
      if (!map.has(entry.risk_id)) {
        map.set(entry.risk_id, entry.actions);
      }
    }
  }
  return map;
}

function normalizeRiskItems(
  items: ReportRiskItem[] | string[] | undefined,
): ReportRiskItem[] {
  if (!items?.length) return [];
  return items.map((item, idx) => {
    if (typeof item === "string") {
      return { risk_id: inferRiskIdFromText(item), text: item };
    }
    return {
      risk_id: item.risk_id?.trim() || "other",
      text: item.text?.trim() || `Риск ${idx + 1}`,
    };
  });
}

function RiskListWithActions({
  title,
  items,
  managerName,
  riskActions,
}: {
  title: string;
  items: ReportRiskItem[] | string[];
  managerName: string;
  riskActions?: Record<string, ManagerRiskAction[]>;
}) {
  const riskItems = normalizeRiskItems(items);
  const focusEntries = getManagerRiskEntries(riskActions, managerName);
  const allEntries = Object.values(riskActions ?? {}).flat();
  const actionsByRiskId = buildActionsByRiskId(focusEntries, allEntries);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!riskItems.length) {
    return <ReportListBlock title={title} items={[]} />;
  }

  return (
    <section className="report-section rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 print:border-zinc-300 print:bg-white">
      <h3 className="report-section-title text-sm font-semibold uppercase tracking-wide text-[#5eead4] print:text-black">
        {title}
      </h3>
      <ul className="mt-2 space-y-3 text-sm text-zinc-200 print:text-zinc-900">
        {riskItems.map((item, idx) => {
          const actions = actionsByRiskId.get(item.risk_id) ?? [];
          const key = `${title}-${item.risk_id}-${idx}`;
          const isOpen = expanded[key] ?? false;
          const showActions = actions.length > 0;

          return (
            <li
              key={key}
              className="report-risk-item rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3 print:border-zinc-300 print:bg-zinc-50"
            >
              <div className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400 print:bg-black" />
                <div className="min-w-0 flex-1">
                  <p>{item.text}</p>
                  {showActions ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="report-risk-toggle inline-flex items-center gap-1 text-xs font-medium text-[#5eead4] transition hover:text-[#2dd4bf]"
                        aria-expanded={isOpen}
                      >
                        <span
                          className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}
                        >
                          ▶
                        </span>
                        Что делать
                      </button>
                      <p className="report-risk-actions-label hidden">Что делать</p>
                      <ul
                        className={`report-risk-actions-list mt-2 space-y-1.5 border-l border-[#0d9488]/40 pl-3 text-xs text-zinc-300 print:text-zinc-800 ${
                          isOpen ? "block" : "hidden"
                        }`}
                      >
                        {actions.map((action, actionIdx) => (
                          <li key={actionIdx} className="report-list-row leading-relaxed">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ReportListBlock({
  title,
  items,
  className = "",
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <section
      className={`report-section rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 print:border-zinc-300 print:bg-white ${className}`}
    >
      <h3 className="report-section-title text-sm font-semibold uppercase tracking-wide text-[#5eead4] print:text-black">
        {title}
      </h3>
      <ul className="mt-2 space-y-2 text-sm text-zinc-200 print:text-zinc-900">
        {items.length ? (
          items.map((item, idx) => (
            <li key={`${item}-${idx}`} className="report-list-row flex gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5eead4] print:bg-black" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-zinc-500 print:text-zinc-700">Нет данных</li>
        )}
      </ul>
    </section>
  );
}

function ReportMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 print:border-zinc-300 print:bg-white">
      <p className="text-xs uppercase tracking-wide text-zinc-500 print:text-zinc-700">
        {label}
      </p>
      <p className="mt-1 text-sm text-zinc-200 print:text-zinc-900">{value || "—"}</p>
    </div>
  );
}

function ReportKpi({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="report-kpi-card rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 print:border-zinc-300 print:bg-white">
      <p className="report-kpi-label text-xs uppercase tracking-wide text-zinc-500 print:text-zinc-700">
        {label}
      </p>
      <p className="report-kpi-value mt-1 text-2xl font-semibold tabular-nums text-zinc-100 print:text-zinc-900">
        {value == null ? "—" : value}
      </p>
    </div>
  );
}

function SkillBreakdownBlock({
  items,
}: {
  items: {
    key: string;
    label: string;
    status: "strong" | "ok" | "risk" | "no_data";
    value: number | null;
    comment: string;
  }[];
}) {
  return (
    <section className="report-section report-skill-section rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 print:border-zinc-300 print:bg-white">
      <h3 className="report-section-title text-sm font-semibold uppercase tracking-wide text-[#5eead4] print:text-black">
        Навыковый разбор
      </h3>
      <div className="report-skill-list mt-3 space-y-2.5">
        {items.length ? (
          items.map((item) => (
            <div
              key={item.key}
              className="report-skill-card rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 print:border-zinc-300 print:bg-white"
            >
              <div className="report-skill-row flex items-start justify-between gap-3">
                <p className="report-skill-row-label min-w-0 flex-1 text-sm font-medium text-zinc-100 print:text-zinc-900">
                  {item.label}
                </p>
                <div className="report-skill-row-meta flex shrink-0 flex-nowrap items-center gap-2">
                  <SkillStatusBadge status={item.status} />
                  <span className="report-skill-row-value shrink-0 text-xs tabular-nums text-zinc-400 print:text-zinc-700">
                    {item.value == null ? "—" : item.value}
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm text-zinc-300 print:text-zinc-900">
                {item.comment || "—"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-500 print:text-zinc-700">Нет данных</p>
        )}
      </div>
    </section>
  );
}

function SkillStatusBadge({
  status,
}: {
  status: "strong" | "ok" | "risk" | "no_data";
}) {
  const styles =
    status === "strong"
      ? "report-skill-badge--strong border-emerald-600/60 bg-emerald-500/10 text-emerald-300"
      : status === "ok"
        ? "report-skill-badge--ok border-amber-600/60 bg-amber-500/10 text-amber-300"
        : status === "risk"
          ? "report-skill-badge--risk border-rose-600/60 bg-rose-500/10 text-rose-300"
          : "report-skill-badge--no_data border-zinc-600 bg-zinc-800 text-zinc-300";

  const label =
    status === "strong"
      ? "strong"
      : status === "ok"
        ? "ok"
        : status === "risk"
          ? "risk"
          : "no_data";

  return (
    <span
      className={`report-skill-badge shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}
