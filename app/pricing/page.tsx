import { SiteFooter } from "@/components/site-footer";
import Link from "next/link";

type Plan = {
  name: string;
  price: string;
  features: string[];
  cta: string;
  popular?: boolean;
};

const plans: Plan[] = [
  {
    name: "Старт",
    price: "3 990 ₽/мес",
    features: [
      "до 20 звонков в месяц",
      "1 менеджер",
      "Анализ звонков с помощью ИИ",
      "Отчёты и рекомендации",
      "Email-поддержка",
    ],
    cta: "Выбрать Старт",
  },
  {
    name: "Стандарт",
    price: "7 990 ₽/мес",
    features: [
      "до 120 звонков в месяц",
      "2 менеджера",
      "Анализ звонков с помощью ИИ",
      "Отчёты и рекомендации",
      "Сравнение менеджеров",
      "Email-поддержка",
    ],
    cta: "Выбрать Стандарт",
    popular: true,
  },
  {
    name: "Про",
    price: "14 490 ₽/мес",
    features: [
      "до 450 звонков в месяц",
      "до 5 менеджеров",
      "Анализ звонков с помощью ИИ",
      "Расширенная аналитика",
      "Командные отчёты",
      "Приоритетная поддержка",
    ],
    cta: "Выбрать Про",
  },
  {
    name: "Бизнес",
    price: "49 990 ₽/мес",
    features: [
      "Безлимитные звонки",
      "до 15 менеджеров",
      "Анализ звонков с помощью ИИ",
      "Полная аналитика и дашборды",
      "Выгрузка отчётов в Excel/PDF",
      "Персональный менеджер",
    ],
    cta: "Выбрать Бизнес",
  },
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-14 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Тарифы SalesCoach
          </h1>
          <p className="mt-3 text-zinc-400">
            Выберите подходящий план для вашего отдела продаж
          </p>
        </header>

        <section className="pricing-trial-card mt-10 rounded-2xl border border-emerald-700/40 bg-emerald-900/15 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Пробный период
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-200">Бесплатно</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-emerald-100">
            <span className="rounded-md bg-emerald-500/20 px-3 py-1">4 дня</span>
            <span className="rounded-md bg-emerald-500/20 px-3 py-1">
              до 20 звонков
            </span>
            <span className="rounded-md bg-emerald-500/20 px-3 py-1">
              до 2 менеджеров
            </span>
          </div>
          <button className="mt-6 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600">
            Начать бесплатно
          </button>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`pricing-plan-card relative rounded-2xl border p-6 ${
                plan.popular
                  ? "pricing-plan-card-popular border-teal-500/60 bg-zinc-900"
                  : "border-zinc-800 bg-zinc-900/70"
              }`}
            >
              {plan.popular ? (
                <span className="absolute right-4 top-4 rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-semibold text-teal-300">
                  Популярный
                </span>
              ) : null}
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              <p className="mt-2 text-2xl font-bold text-teal-300">{plan.price}</p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <button className="mt-6 w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500">
                {plan.cta}
              </button>
            </article>
          ))}
        </section>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Все цены указаны с учётом НПД. Оплата производится в соответствии с{" "}
          <Link href="/offer" className="text-teal-300 transition hover:text-teal-200">
            публичной офертой
          </Link>
          .
        </p>

        <SiteFooter />
      </div>
    </main>
  );
}
