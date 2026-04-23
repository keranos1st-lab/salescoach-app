"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export type ManagerRow = {
  id: string;
  name: string;
  calls_count: number | null;
  score_avg: number | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}

export function ManagersWorkspace({
  initialManagers,
}: {
  initialManagers: ManagerRow[];
}) {
  const router = useRouter();
  const [managers, setManagers] = useState<ManagerRow[]>(initialManagers);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...managers].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [managers]
  );

  async function createManager() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Введите имя менеджера");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/managers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const json = (await res.json()) as {
        error?: string;
        manager?: ManagerRow;
      };

      if (!res.ok || !json.manager) {
        setError(json.error || "Не удалось добавить менеджера");
        return;
      }

      setManagers((prev) => [json.manager!, ...prev]);
      setName("");
      setModalOpen(false);
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  async function deleteManager(id: string) {
    const ok = window.confirm(
      "Удалить менеджера? Все его звонки также будут удалены."
    );
    if (!ok) return;

    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/managers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Не удалось удалить менеджера");
        return;
      }
      setManagers((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch {
      setError("Ошибка сети");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Менеджеры</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Управляйте командой и отслеживайте эффективность
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="rounded-xl bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0d9488]/25 transition hover:bg-[#0f766e]"
        >
          Добавить менеджера
        </button>
      </header>

      {error ? (
        <p
          className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 px-4 py-10 text-center text-zinc-500">
            Пока нет менеджеров
          </div>
        ) : (
          sorted.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-4">
                <Link
                  href={`/managers/${m.id}`}
                  className="min-w-0 flex-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40"
                >
                  <p className="truncate text-base font-semibold text-zinc-100">{m.name}</p>
                  <div className="mt-3 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Кол-во звонков
                      </p>
                      <p className="mt-1 tabular-nums">{m.calls_count ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Средний балл
                      </p>
                      <p className="mt-1 tabular-nums">
                        {m.score_avg == null ? "—" : Number(m.score_avg).toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        Дата добавления
                      </p>
                      <p className="mt-1 text-zinc-400">{formatDate(m.created_at)}</p>
                    </div>
                  </div>
                </Link>
                <button
                  type="button"
                  disabled={deletingId === m.id}
                  onClick={() => deleteManager(m.id)}
                  className="shrink-0 rounded-lg border border-red-900/60 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-950/40 disabled:opacity-50"
                >
                  {deletingId === m.id ? "Удаление..." : "Удалить"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-zinc-100">
              Добавить менеджера
            </h2>
            <div className="mt-4 space-y-2">
              <label
                htmlFor="manager-name"
                className="text-sm font-medium text-zinc-300"
              >
                Имя менеджера
              </label>
              <input
                id="manager-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Иван Петров"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/25"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (loading) return;
                  setModalOpen(false);
                  setName("");
                  setError(null);
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={createManager}
                className="rounded-xl bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f766e] disabled:opacity-50"
              >
                {loading ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
