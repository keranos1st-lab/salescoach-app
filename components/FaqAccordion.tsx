"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  /** Текст ответа; вставки вида [/path] рендерятся как внутренние ссылки */
  answer: string;
};

const LINK_IN_ANSWER = /\[(\/[^\]]+)\]/g;

function renderAnswerWithLinks(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(LINK_IN_ANSWER.source, "g");
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index));
    }
    const href = m[1];
    parts.push(
      <Link
        key={key++}
        href={href}
        className="text-[#5eead4] underline-offset-2 hover:underline"
      >
        {href}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }
  return parts.length ? parts : text;
}

type Props = {
  items: readonly FaqItem[];
};

export function FaqAccordion({ items }: Props) {
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set);
  }, [items]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const qNorm = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category && item.category !== category) return false;
      if (!qNorm) return true;
      const hay =
        `${item.question} ${item.answer} ${item.category}`.toLowerCase();
      return hay.includes(qNorm);
    });
  }, [items, category, qNorm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <label className="block w-full min-w-[200px] flex-1 sm:max-w-md">
          <span className="sr-only">Поиск по вопросам</span>
          <input
            type="search"
            placeholder="Поиск по FAQ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-[#0d9488]"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            category === null
              ? "border-[#0d9488] bg-[#0d9488]/20 text-[#5eead4]"
              : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          }`}
        >
          Все категории
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              category === cat
                ? "border-[#0d9488] bg-[#0d9488]/20 text-[#5eead4]"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
          Ничего не найдено. Попробуйте другой запрос или категорию.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => {
            const isOpen = openId === item.id;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-zinc-100 transition hover:bg-zinc-800/50"
                >
                  <span>{item.question}</span>
                  <span
                    className={`shrink-0 text-zinc-500 transition ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  >
                    ▼
                  </span>
                </button>
                {isOpen ? (
                  <div className="border-t border-zinc-800 px-4 py-3 text-sm leading-7 text-zinc-300">
                    {renderAnswerWithLinks(item.answer)}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
