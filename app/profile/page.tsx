import { Suspense } from "react";
import { PaymentToast } from "@/components/profile/PaymentToast";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getAuthContext } from "@/lib/get-auth-context";
import { PLANS, type PlanKey } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import type { Plan, Subscription } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

type SubscriptionWithUsage = Subscription & {
  callsUsed?: number | null;
  managersUsed?: number | null;
};

function prismaPlanToPlanKey(plan: Plan): PlanKey {
  if (plan === "START") {
    return "STARTER";
  }
  return plan as PlanKey;
}

export default async function ProfilePage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const { user, subscription } = ctx;
  const companyId = user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // depends on authContext: prisma uses companyId from ctx (single query).
  const callsUsed =
    companyId != null
      ? await prisma.call.count({
          where: {
            companyId,
            createdAt: { gte: startOfMonth },
          },
        })
      : 0;
  const managersUsed = ctx.managers.length;

  const subUsage = subscription as SubscriptionWithUsage | null | undefined;

  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planLabelKey = prismaPlanToPlanKey(plan);
  const planLabel = PLANS[planLabelKey]?.label ?? plan;

  const priceLine =
    plan === "TRIAL"
      ? "Бесплатно"
      : `${PLANS[planLabelKey].price.toLocaleString("ru-RU")} ₽/мес`;

  const maxCallsFallback = PLANS[planLabelKey].maxCalls;
  const maxCallsDisplay =
    plan === "BUSINESS" || maxCallsFallback == null
      ? "∞"
      : String(subscription?.maxCalls ?? maxCallsFallback);
  const maxManagers = subscription?.maxManagers ?? PLANS[planLabelKey].maxManagers;

  const trialEndsAt = subscription?.trialEndsAt ?? null;
  let trialDaysLeft = 0;
  if (plan === "TRIAL" && trialEndsAt) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Личные данные</h2>
          <div className="mt-4">
            <ProfileForm name={user.name} email={user.email ?? ""} />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Текущий тариф</h2>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Название: </span>
              {planLabel}
            </p>
            <p>
              <span className="text-zinc-500">Цена: </span>
              {priceLine}
            </p>
            <p>
              Звонки: {subUsage?.callsUsed ?? callsUsed} / {maxCallsDisplay}
            </p>
            <p>
              Менеджеры: {subUsage?.managersUsed ?? managersUsed} / {maxManagers}
            </p>
            {plan === "TRIAL" && trialEndsAt ? (
              trialDaysLeft === 0 ? (
                <p className="text-red-400">Пробный период истёк</p>
              ) : (
                <p className="text-emerald-400">Осталось {trialDaysLeft} дней</p>
              )
            ) : null}
          </div>
          <Link
            href="/pricing"
            className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            Сменить тариф →
          </Link>
        </section>
      </div>
      <Suspense fallback={null}>
        <PaymentToast />
      </Suspense>
    </main>
  );
}
