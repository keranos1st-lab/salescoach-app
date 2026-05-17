"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function resolveCallbackUrl(origin: string, raw: string | null): string {
  const path = raw?.trim() || "/dashboard";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${origin}${path}`;
  }
  return `${origin}/${path}`;
}

/** Credentials sign-in without `next-auth/react` (no SessionProvider / session polling on this route). */
async function signInCredentials(
  email: string,
  password: string,
  callbackUrl: string,
) {
  const origin = window.location.origin;
  const csrfRes = await fetch(`${origin}/api/auth/csrf`, { credentials: "include" });
  if (!csrfRes.ok) {
    return { ok: false as const, error: "CSRF недоступен" };
  }
  const { csrfToken } = (await csrfRes.json()) as { csrfToken?: string };
  if (!csrfToken) {
    return { ok: false as const, error: "Нет CSRF токена" };
  }

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl,
    json: "true",
    redirect: "false",
  });

  const res = await fetch(`${origin}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
  };

  if (res.ok && !data.error) {
    return { ok: true as const, url: data.url ?? callbackUrl };
  }

  return {
    ok: false as const,
    error: data.error ?? "Неверный email или пароль",
  };
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const origin = window.location.origin;
    const callbackUrl = resolveCallbackUrl(
      origin,
      searchParams.get("callbackUrl"),
    );

    const result = await signInCredentials(
      email.trim().toLowerCase(),
      password,
      callbackUrl,
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.location.assign(result.url);
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
      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-zinc-500 transition-colors hover:text-[#5eead4]"
        >
          Забыли пароль?
        </Link>
      </div>
      <p className="text-center text-sm text-zinc-500">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-[#5eead4] hover:underline">
          Регистрация
        </Link>
      </p>
    </form>
  );
}
