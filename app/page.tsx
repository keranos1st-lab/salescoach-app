import Link from "next/link";
import { PublicSurfaceHeader } from "@/components/public-surface-header";
import { SiteFooter } from "@/components/site-footer";

const howItWorksSteps = [
  {
    emoji: "📁",
    text: "Загрузите запись звонка (MP3, WAV, WEBM, M4A)",
  },
  {
    emoji: "🤖",
    text: "ИИ транскрибирует и анализирует разговор",
  },
  {
    emoji: "📊",
    text: "Получите разбор: ошибки, сильные стороны, оценку по скрипту",
  },
] as const;

const benefitCards = [
  {
    title: "Контроль качества",
    description: "Видите работу каждого менеджера без прослушки",
  },
  {
    title: "Экономия времени",
    description: "Анализ звонка за минуты вместо часов",
  },
  {
    title: "Рост продаж",
    description: "Находите слабые места и исправляете их системно",
  },
] as const;

export default function HomePage() {
  return (
    <>
      <PublicSurfaceHeader />
      <main className="min-h-screen bg-zinc-950 px-4 py-24 pb-16 text-zinc-100">
        <div className="mx-auto max-w-4xl">
          <section className="text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Узнайте, почему менеджеры теряют сделки
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-zinc-400 sm:text-lg">
              SalesCoach анализирует звонки и показывает ошибки каждого
              менеджера. Результат — за минуты, без ручной прослушки.
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
            <p className="mt-3 text-center text-xs text-zinc-500">
              4 дня бесплатно · до 20 звонков · без карты
            </p>
          </section>

          <section className="mt-20 sm:mt-24">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Как это работает
            </h2>
            <ul className="mt-8 space-y-4">
              {howItWorksSteps.map((step, index) => (
                <li
                  key={step.text}
                  className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span
                    className="text-2xl leading-none sm:text-[1.75rem]"
                    aria-hidden
                  >
                    {step.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Шаг {index + 1}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200 sm:text-base">
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-20 sm:mt-24">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Что вы получаете
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefitCards.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-left"
                >
                  <h3 className="text-lg font-semibold text-zinc-100">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {card.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="mt-20">
            <SiteFooter />
          </div>
        </div>
      </main>
    </>
  );
}
