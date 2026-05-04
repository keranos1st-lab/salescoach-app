"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const emailNorm = email.trim().toLowerCase();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || undefined,
        email: emailNorm,
        password,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setPending(false);
      setError(data.error ?? "Ошибка регистрации");
      return;
    }
    const sign = await signIn("credentials", {
      email: emailNorm,
      password,
      redirect: false,
    });
    setPending(false);
    if (sign?.error) {
      setError("Аккаунт создан, но вход не удался. Попробуйте войти вручную.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl"
    >
      <h1 className="text-center text-xl font-semibold text-zinc-100">
        Регистрация
      </h1>
      {error ? (
        <p className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      ) : null}
      <label className="block text-sm text-zinc-400">
        Имя (необязательно)
        <input
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-[#0d9488]"
        />
      </label>
      <label className="block text-sm text-zinc-400">
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-[#0d9488]"
        />
      </label>
      <label className="block text-sm text-zinc-400">
        Пароль
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-[#0d9488]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-[#0d9488] py-2.5 text-sm font-medium text-white transition hover:bg-[#0f766e] disabled:opacity-50"
      >
        {pending ? "Создание…" : "Создать аккаунт"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-[#5eead4] hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
