"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    console.log("ответ сервера:", res.status, await res.text());
    setPending(false);
    setSent(true);
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Восстановление пароля</h1>
        <p className="mt-2 text-sm text-zinc-400">Введите email, и мы отправим ссылку</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none focus:border-[#0d9488]"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-60"
          >
            {pending ? "Отправка..." : "Отправить ссылку"}
          </button>
        </form>

        {sent ? (
          <p className="mt-4 rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
            Если этот email зарегистрирован, письмо уже в пути
          </p>
        ) : null}

        <p className="mt-4 text-sm text-zinc-400">
          <Link href="/login" className="text-[#5eead4] hover:text-[#2dd4bf]">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </div>
  );
}
