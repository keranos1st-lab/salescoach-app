import Link from "next/link";
import { PublicSurfaceHeader } from "@/components/public-surface-header";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <>
      <PublicSurfaceHeader />
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-24 text-zinc-100">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            SalesCoach <span className="text-[#5eead4]">AI</span>
          </h1>
          <p className="mt-4 text-zinc-400">
            Анализ звонков и коучинг для отдела продаж
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-[#0d9488] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f766e]"
            >
              Начать бесплатно
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-zinc-600 px-5 py-2.5 text-sm text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Войти
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-transparent px-4 py-2.5 text-sm text-[#5eead4] underline-offset-4 hover:underline"
            >
              Тарифы
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg px-4 py-2.5 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              В кабинет →
            </Link>
          </div>
        </div>
        <div className="mt-auto w-full pt-16">
          <SiteFooter />
        </div>
      </main>
    </>
  );
}
