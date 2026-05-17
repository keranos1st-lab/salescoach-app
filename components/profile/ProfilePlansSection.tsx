"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SubscribePlanButton } from "@/components/profile/SubscribePlanButton";
import { PLANS, type PlanKey } from "@/lib/plans";

const PAID_PLAN_KEYS = ["STARTER", "STANDARD", "PRO", "BUSINESS"] as const satisfies readonly PlanKey[];

type ProfilePlansSectionProps = {
  currentPlanKey: PlanKey;
  showDashboardLink?: boolean;
};

export function ProfilePlansSection({
  currentPlanKey,
  showDashboardLink = false,
}: ProfilePlansSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const searchParams = useSearchParams();
  const scrolled = useRef(false);

  useEffect(() => {
    if (searchParams.get("open") !== "plans" || scrolled.current) return;
    scrolled.current = true;
    const id = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => window.clearTimeout(id);
  }, [searchParams]);

  return (
    <section
      ref={sectionRef}
      id="subscription-plans"
      className="scroll-mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Тарифы</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Выберите план и перейдите к оплате через Robokassa
          </p>
        </div>
        {showDashboardLink ? (
          <Link
            href="/dashboard"
            className="shrink-0 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/80"
          >
            Вернуться в дашборд
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PAID_PLAN_KEYS.map((planKey) => {
          const planDef = PLANS[planKey];
          const isPopular = planKey === "STANDARD";
          const priceText = `${planDef.price.toLocaleString("ru-RU")} ₽/мес`;

          return (
            <article
              key={planKey}
              className={`relative rounded-xl border p-5 ${
                isPopular
                  ? "border-teal-500/60 bg-zinc-950"
                  : "border-zinc-800 bg-zinc-950/60"
              }`}
            >
              {isPopular ? (
                <span className="absolute right-3 top-3 rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-300">
                  Популярный
                </span>
              ) : null}
              <h3 className="text-lg font-semibold">{planDef.label}</h3>
              <p className="mt-1 text-xl font-bold text-teal-300">{priceText}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-zinc-400">
                {planDef.features.slice(0, 4).map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <div className="mt-5">
                <SubscribePlanButton
                  plan={planKey}
                  isCurrent={currentPlanKey === planKey}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
