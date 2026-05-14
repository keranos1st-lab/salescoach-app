import { BuyButton } from "@/components/pricing/BuyButton";
import { CurrentPlanBadge } from "@/components/pricing/current-plan-badge";
import { SiteFooter } from "@/components/site-footer";
import { PLANS, type PlanKey } from "@/lib/plans";
import type { Plan } from "@prisma/client";
import Link from "next/link";

const PAID_PLAN_KEYS = ["STARTER", "STANDARD", "PRO", "BUSINESS"] as const satisfies readonly PlanKey[];

/** SSR default для гостя; бейдж «Текущий» на карточках — `CurrentPlanBadge` + `/api/me/plan`. */
export default function PricingPage() {
  const currentPlan = "TRIAL" as Plan;

  return (
    <main
      className="min-h-screen bg-zinc-950 px-4 py-14 text-zinc-100"
      data-ssr-default-plan={currentPlan}
    >
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
            {PLANS.TRIAL.features.map((feature) => (
              <span key={feature} className="rounded-md bg-emerald-500/20 px-3 py-1">
                {feature}
              </span>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-6 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Начать бесплатно
          </Link>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PAID_PLAN_KEYS.map((planKey) => {
            const planDef = PLANS[planKey];
            const isPopular = planKey === "STANDARD";
            const priceText = `${planDef.price.toLocaleString("ru-RU")} ₽/мес`;

            return (
              <article
                key={planKey}
                className={`pricing-plan-card relative rounded-2xl border p-6 ${
                  isPopular
                    ? "pricing-plan-card-popular border-teal-500/60 bg-zinc-900"
                    : "border-zinc-800 bg-zinc-900/70"
                }`}
              >
                <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
                  <CurrentPlanBadge planKey={planKey} />
                  {isPopular ? (
                    <span className="rounded-full bg-teal-500/20 px-2.5 py-1 text-xs font-semibold text-teal-300">
                      Популярный
                    </span>
                  ) : null}
                </div>
                <h2 className="text-xl font-semibold">{planDef.label}</h2>
                <p className="mt-2 text-2xl font-bold text-teal-300">{priceText}</p>
                <ul className="mt-5 space-y-2 text-sm text-zinc-300">
                  {planDef.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  <BuyButton plan={planKey} />
                </div>
              </article>
            );
          })}
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
