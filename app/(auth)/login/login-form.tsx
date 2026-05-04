"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setPending(false);
    if (res?.error) {
      setError("Неверный email или пароль");
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
      <h1 className="text-center text-xl font-semibold text-zinc-100">Вход</h1>
      {error ? (
        <p className="rounded-lg bg-red-950/50 px-3 py-2 text-center text-sm text-red-300">
          {error}
        </p>
      ) : null}
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
          autoComplete="current-password"
          required
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
        {pending ? "Вход…" : "Войти"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-[#5eead4] hover:underline">
          Регистрация
        </Link>
      </p>
    </form>
  );
}
