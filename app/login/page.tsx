"use client";

import { createClient } from "@/lib/supabase";
import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"signin" | "signup" | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("signin");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading("signup");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-950 px-4 py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[28rem] w-[28rem] rounded-full bg-[#0d9488]/10 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[24rem] w-[24rem] rounded-full bg-teal-900/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="brand-logo inline-block text-2xl font-semibold tracking-tight"
          >
            SalesCoach{" "}
            <span className="bg-gradient-to-r from-[#0d9488] to-teal-400 bg-clip-text text-transparent">
              AI
            </span>
          </Link>
          <p className="mt-2 text-sm text-zinc-400">
            Войдите или создайте аккаунт
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <form className="space-y-5" onSubmit={handleSignIn}>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none ring-[#0d9488]/0 transition-[box-shadow,border-color] placeholder:text-zinc-600 focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30"
                placeholder="you@company.com"
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
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/80 px-4 py-3 text-zinc-100 outline-none ring-[#0d9488]/0 transition-[box-shadow,border-color] placeholder:text-zinc-600 focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/30"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <p
                className="rounded-lg border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-300"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:gap-3">
              <button
                type="submit"
                disabled={loading !== null}
                className="flex-1 rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0d9488]/25 transition hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "signin" ? "Вход…" : "Войти"}
              </button>
              <button
                type="button"
                disabled={loading !== null}
                onClick={handleSignUp}
                className="flex-1 rounded-xl border border-zinc-600 bg-zinc-800/50 px-4 py-3 text-sm font-semibold text-zinc-100 transition hover:border-[#0d9488]/50 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "signup" ? "Регистрация…" : "Зарегистрироваться"}
              </button>
            </div>
          </form>
        </div>

        <SiteFooter />
      </div>
    </div>
  );
}
