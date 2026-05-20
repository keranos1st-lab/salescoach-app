import Link from "next/link";
import { PublicSurfaceHeader } from "@/components/public-surface-header";
import { SiteFooter } from "@/components/site-footer";

const howItWorksSteps = [
  {
    num: "01",
    title: "Загружаете запись",
    description: "Любой формат: MP3, WAV, WEBM, M4A",
  },
  {
    num: "02",
    title: "ИИ анализирует",
    description:
      "Транскрибирует звонок и оценивает качество работы менеджера",
  },
  {
    num: "03",
    title: "Получаете разбор",
    description: "Ошибки, сильные стороны, оценка по скрипту",
  },
] as const;

const benefitCards = [
  {
    title: "Оценка по 6 параметрам",
    description:
      "Следование структуре разговора, работа с возражениями, тон и контакт с клиентом, чёткость следующего шага, попытки допродажи, отстройка от конкурентов — каждый звонок получает оценку от 0 до 10 по каждому критерию.",
  },
  {
    title: "Конкретные ошибки текстом",
    description:
      "Не просто цифра — список того, что именно пошло не так в этом звонке. Менеджер видит конкретику, а не абстрактную оценку.",
  },
  {
    title: "Сильные стороны и резюме",
    description:
      "Что менеджер сделал хорошо и краткое резюме звонка. Удобно для разбора на планёрке или личной обратной связи.",
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
              SalesCoach <span className="text-[#5eead4]">AI</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-balance text-lg font-medium text-zinc-300 sm:text-xl">
              Узнайте, почему менеджеры теряют сделки
            </p>
            <p className="mx-auto mt-3 max-w-xl text-balance text-zinc-400 sm:text-lg">
              Оценивает качество по 6 ключевым параметрам продаж, находит
              конкретные ошибки и сильные стороны каждого менеджера. Без ручной
              прослушки.
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
          </section>

          <section className="mt-20 sm:mt-24">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Как это работает
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {howItWorksSteps.map((step) => (
                <article
                  key={step.num}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-left"
                >
                  <p className="text-xs font-semibold tabular-nums tracking-widest text-zinc-500">
                    {step.num}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-zinc-100">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
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
