"use client";

import { SiteFooter } from "@/components/site-footer";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const successMessage =
    searchParams.get("message") === "password-reset-success"
      ? "Пароль изменён, войдите снова"
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setPending(false);
    if (result?.error) {
      setError("Неверный email или пароль");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <h1 className="text-2xl font-semibold text-white">Вход</h1>
        <p className="mt-2 text-sm text-zinc-400">Войдите в аккаунт SalesCoach</p>

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

          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-sm text-[#5eead4] hover:text-[#2dd4bf]">
              Забыли пароль?
            </Link>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f766e] disabled:opacity-60"
          >
            {pending ? "Вход..." : "Войти"}
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-400">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[#5eead4] hover:text-[#2dd4bf]">
            Зарегистрируйтесь
          </Link>
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
