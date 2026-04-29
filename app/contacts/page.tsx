"use client";

import { SiteFooter } from "@/components/site-footer";
import { useState } from "react";

type Feedback = { kind: "success" | "error"; text: string } | null;

export default function ContactsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });

      if (response.ok) {
        setFeedback({
          kind: "success",
          text: "Спасибо! Мы свяжемся с вами.",
        });
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setFeedback({
          kind: "error",
          text: "Что-то пошло не так, попробуйте позже.",
        });
      }
    } catch {
      setFeedback({
        kind: "error",
        text: "Что-то пошло не так, попробуйте позже.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-14 text-zinc-100">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Контакты
        </h1>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
            <a
              href="mailto:keranosai@mail.ru"
              className="mt-2 inline-block text-lg text-teal-300 transition hover:text-teal-200"
            >
              keranosai@mail.ru
            </a>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Телефон</p>
            <a
              href="tel:+79953968920"
              className="mt-2 inline-block text-lg text-teal-300 transition hover:text-teal-200"
            >
              +7 995 396-89-20
            </a>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Город</p>
            <p className="mt-2 text-lg text-zinc-200">Владивосток</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Время ответа
            </p>
            <p className="mt-2 text-lg text-zinc-200">
              в течение 24 часов по рабочим дням
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-xl font-semibold">Форма обратной связи</h2>
          {feedback && (
            <p
              className={`mt-3 text-sm ${
                feedback.kind === "success" ? "text-teal-400" : "text-red-400"
              }`}
              role="alert"
            >
              {feedback.text}
            </p>
          )}
          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Имя"
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none transition focus:border-teal-500"
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none transition focus:border-teal-500"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Сообщение"
              required
              rows={5}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none transition focus:border-teal-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-60"
            >
              {submitting ? "Отправка…" : "Отправить"}
            </button>
          </form>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
