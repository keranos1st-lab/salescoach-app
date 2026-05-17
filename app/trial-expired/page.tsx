import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

function TimerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2" />
      <path d="M9 3h6" />
      <path d="M12 3v2" />
    </svg>
  );
}

export default function TrialExpiredPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600/20 text-teal-400">
            <TimerIcon className="h-9 w-9" />
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
            Пробный период завершён
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
            Ваш 4-дневный триал закончился. Подключите тариф, чтобы продолжить
            работу с SalesChek.
          </p>
          <Link
            href="/profile?open=plans"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-teal-500"
          >
            Выбрать тариф
          </Link>
          <p className="mt-6">
            <Link
              href="/api/auth/signout"
              className="text-sm text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
            >
              Выйти из аккаунта
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
