"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";

export type ManagerOption = { id: string; name: string };

export type CallListItem = {
  id: string;
  created_at: string;
  score: number | null;
  transcript: string | null;
  positives: unknown;
  negatives: unknown;
  next_task: string | null;
  audio_url: string | null;
  managers: { name: string } | null;
};

type AnalysisResult = {
  score: number;
  positives: string[];
  negatives: string[];
  next_task: string;
  product_context_used?: boolean;
  matched_services?: string[];
  matched_products?: string[];
  matched_usps?: string[];
  matched_upsells?: string[];
  product_notes?: string[];
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter(Boolean);
}

function scoreStyles(score: number) {
  if (score >= 80) {
    return {
      ring: "border-emerald-500 shadow-emerald-500/20",
      text: "text-emerald-400",
      glow: "from-emerald-500/20 to-transparent",
    };
  }
  if (score >= 50) {
    return {
      ring: "border-amber-500 shadow-amber-500/20",
      text: "text-amber-400",
      glow: "from-amber-500/20 to-transparent",
    };
  }
  return {
    ring: "border-red-500 shadow-red-500/20",
    text: "text-red-400",
    glow: "from-red-500/20 to-transparent",
  };
}

function ResultCard({ analysis }: { analysis: AnalysisResult | null | undefined }) {
  if (!analysis) return null;
  const s = scoreStyles(analysis.score);
  const matchedServices = asStringArray(analysis.matched_services);
  const matchedProducts = asStringArray(analysis.matched_products);
  const matchedUsps = asStringArray(analysis.matched_usps);
  const matchedUpsells = asStringArray(analysis.matched_upsells);
  const productNotes = asStringArray(analysis.product_notes);
  const showProductContext =
    analysis.product_context_used === true &&
    (matchedServices.length > 0 ||
      matchedProducts.length > 0 ||
      matchedUsps.length > 0 ||
      matchedUpsells.length > 0 ||
      productNotes.length > 0);

  const renderChips = (
    items: string[],
    tone: "default" | "important" = "default"
  ) => (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className={
            tone === "important"
              ? "inline-flex items-center rounded-full border border-[#0d9488]/45 bg-[#0d9488]/15 px-2.5 py-1 text-xs font-medium text-[#99f6e4]"
              : "inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-200"
          }
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-xl">
      <div
        className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${s.glow} blur-2xl`}
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
        <div
          className={`flex h-36 w-36 shrink-0 flex-col items-center justify-center self-center rounded-full border-4 bg-zinc-950/80 shadow-lg sm:self-start ${s.ring} ${s.text}`}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Балл
          </span>
          <span className="text-4xl font-bold tabular-nums">{analysis.score}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-[#5eead4]">Сильные стороны</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
              {analysis.positives.length ? (
                analysis.positives.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{p}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500">Нет данных</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-300/90">Зоны роста</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
              {analysis.negatives.length ? (
                analysis.negatives.map((n, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                    <span>{n}</span>
                  </li>
                ))
              ) : (
                <li className="text-zinc-500">Нет данных</li>
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/10 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5eead4]">
              Задача на следующий звонок
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              {analysis.next_task || "—"}
            </p>
          </div>
          {showProductContext ? (
            <div className="rounded-xl border border-zinc-700/80 bg-zinc-950/50 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#5eead4]">
                Контекст продукта
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {matchedServices.length ? (
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Услуги</p>
                    {renderChips(matchedServices)}
                  </div>
                ) : null}
                {matchedProducts.length ? (
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Продукты</p>
                    {renderChips(matchedProducts)}
                  </div>
                ) : null}
                {matchedUsps.length ? (
                  <div>
                    <p className="text-xs font-medium text-zinc-400">УТП</p>
                    {renderChips(matchedUsps, "important")}
                  </div>
                ) : null}
                {matchedUpsells.length ? (
                  <div>
                    <p className="text-xs font-medium text-zinc-400">Допродажи</p>
                    {renderChips(matchedUpsells, "important")}
                  </div>
                ) : null}
              </div>
              {productNotes.length ? (
                <div className="mt-4 border-t border-zinc-800 pt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                    Что заметила система
                  </h4>
                  <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                    {productNotes.map((note, index) => (
                      <li key={`${note}-${index}`} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5eead4]" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CallsWorkspace({
  managers,
  initialCalls,
}: {
  managers: ManagerOption[];
  initialCalls: CallListItem[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [managerId, setManagerId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [calls, setCalls] = useState<CallListItem[]>(initialCalls);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [selectedManagerName, setSelectedManagerName] = useState("all");
  const [expandedTranscriptIds, setExpandedTranscriptIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setCalls(initialCalls);
  }, [initialCalls]);

  const pickFile = useCallback((f: File | null | undefined) => {
    if (!f || !f.size) return;
    if (!f.type.startsWith("audio/")) {
      setError("Нужен аудиофайл (например mp3, wav, webm)");
      return;
    }
    setError(null);
    setFile(f);
    setResult(null);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      pickFile(e.dataTransfer.files[0]);
    },
    [pickFile]
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  async function analyze() {
    if (!file || !managerId) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("managerId", managerId);
      const res = await fetch("/api/calls/analyze", {
        method: "POST",
        body: fd,
      });
      const raw = await res.text();
      let json: {
        error?: string;
        analysis?: AnalysisResult;
        call?: CallListItem;
      };
      try {
        json = JSON.parse(raw) as typeof json;
      } catch {
        setError(
          raw.trim()
            ? `Ошибка сервера (${res.status}): ${raw.slice(0, 400)}`
            : `Ошибка сервера (${res.status})`
        );
        return;
      }
      if (!res.ok) {
        const apiErr =
          typeof json.error === "string" && json.error.trim()
            ? json.error.trim()
            : `Запрос не выполнен (HTTP ${res.status})`;
        setError(apiErr);
        return;
      }
      if (json.analysis) {
        setResult(json.analysis);
      }
      if (json.call) {
        const mgr = managers.find((m) => m.id === managerId);
        setCalls((prev) => {
          const next = [
            {
              ...json.call!,
              managers: mgr ? { name: mgr.name } : null,
            },
            ...prev.filter((c) => c.id !== json.call!.id),
          ];
          return next.sort(
            (a, b) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      }
      router.refresh();
    } catch {
      setError("Сеть или сервер недоступны");
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze = Boolean(file && managerId && !loading);
  const managerFilterOptions = useMemo(() => {
    const uniq = Array.from(
      new Set(calls.map((call) => call.managers?.name?.trim()).filter(Boolean))
    ) as string[];
    return uniq.sort((a, b) => a.localeCompare(b, "ru"));
  }, [calls]);
  const filteredCalls =
    selectedManagerName === "all"
      ? calls
      : calls.filter((c) => c.managers?.name === selectedManagerName);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Звонки</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Загрузите запись, выберите менеджера и получите разбор с ИИ
        </p>
      </header>

      {managers.length === 0 ? (
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200/90">
          Сначала добавьте менеджеров в разделе «Менеджеры», чтобы привязать звонок.
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
          dragOver
            ? "border-[#0d9488] bg-[#0d9488]/10"
            : "border-zinc-700 bg-zinc-900/40 hover:border-zinc-600 hover:bg-zinc-900/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        <p className="text-sm font-medium text-zinc-200">
          Перетащите аудио сюда или нажмите для выбора
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          mp3, wav, webm, m4a и др. · до 25 МБ
        </p>
        {file ? (
          <p className="mt-4 truncate text-sm text-[#5eead4]">{file.name}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="manager" className="text-sm font-medium text-zinc-300">
          Менеджер
        </label>
        <select
          id="manager"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
          disabled={managers.length === 0}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25 disabled:opacity-50"
        >
          <option value="">Выберите менеджера</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        disabled={!canAnalyze}
        onClick={analyze}
        className="w-full rounded-xl bg-[#0d9488] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#0d9488]/25 transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Анализ…" : "Анализировать звонок"}
      </button>

      {error ? (
        <p
          className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {result ? <ResultCard analysis={result} /> : null}

      <section className="border-t border-zinc-800 pt-10">
        <div className="mb-6 space-y-2">
          <label
            htmlFor="history-manager-filter"
            className="text-sm font-medium text-zinc-300"
          >
            Фильтр по менеджеру
          </label>
          <select
            id="history-manager-filter"
            value={selectedManagerName}
            onChange={(e) => setSelectedManagerName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25"
          >
            <option value="all">Все менеджеры</option>
            {managerFilterOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          История звонков
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Все звонки, отсортированы по дате (новые сверху)
        </p>
        <ul className="mt-6 space-y-3">
          {filteredCalls.length === 0 ? (
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
              {calls.length === 0
                ? "Пока нет звонков"
                : "Нет звонков для выбранного менеджера"}
            </li>
          ) : (
            filteredCalls.map((c) => (
              <li key={c.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setExpandedCallId((prev) => (prev === c.id ? null : c.id))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setExpandedCallId((prev) => (prev === c.id ? null : c.id));
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition hover:border-zinc-700 hover:bg-zinc-900/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${
                          c.score == null
                            ? "border-zinc-600 text-zinc-400"
                            : c.score >= 80
                              ? "border-emerald-500/70 bg-emerald-500/10 text-emerald-400"
                              : c.score >= 50
                                ? "border-amber-500/70 bg-amber-500/10 text-amber-400"
                                : "border-red-500/70 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {c.score ?? "—"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {c.managers?.name ?? "Менеджер"}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(c.created_at).toLocaleString("ru-RU")}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#5eead4]">
                      {expandedCallId === c.id ? "Скрыть анализ" : "Показать анализ"}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg border border-[#0d9488]/25 bg-[#0d9488]/10 px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5eead4]">
                      Задача на следующий звонок
                    </p>
                    <p className="mt-1 text-sm text-zinc-200">{c.next_task || "—"}</p>
                  </div>

                  {expandedCallId === c.id ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
                          Сильные стороны
                        </h3>
                        <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                          {asStringArray(c.positives).length ? (
                            asStringArray(c.positives).map((item, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-zinc-500">Нет данных</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-rose-300">
                          Зоны роста
                        </h3>
                        <ul className="mt-2 space-y-1.5 text-sm text-zinc-300">
                          {asStringArray(c.negatives).length ? (
                            asStringArray(c.negatives).map((item, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-zinc-500">Нет данных</li>
                          )}
                        </ul>
                      </div>
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTranscriptIds((prev) => ({
                              ...prev,
                              [c.id]: !prev[c.id],
                            }));
                          }}
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-300">
                              Транскрипт разговора
                            </h3>
                            <span className="text-xs text-[#5eead4]">
                              {expandedTranscriptIds[c.id]
                                ? "Свернуть"
                                : "Развернуть"}
                            </span>
                          </div>
                          {expandedTranscriptIds[c.id] ? (
                            <pre className="mt-3 max-h-[200px] overflow-y-auto rounded-md bg-zinc-800 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap">
                              {c.transcript?.trim() || "Транскрипт отсутствует"}
                            </pre>
                          ) : null}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
