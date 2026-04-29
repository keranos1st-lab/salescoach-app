"use client";

import { SiteFooter } from "@/components/site-footer";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
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

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const payload = (await res.json()) as { error?: string };
    if (!res.ok) {
      setPending(false);
      setError(payload.error || "Не удалось зарегистрироваться");
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setPending(false);

    if (login?.error) {
      setError("Регистрация прошла, но вход не выполнен. Войдите вручную.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Регистрация</h1>
        <p className="mt-2 text-sm text-zinc-400">Создайте аккаунт SalesCoach</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-zinc-300">
              Имя
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none focus:border-[#0d9488]"
            />
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none focus:border-[#0d9488]"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-60"
          >
            {pending ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-400">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[#5eead4] hover:text-[#2dd4bf]">
            Войти
          </Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
