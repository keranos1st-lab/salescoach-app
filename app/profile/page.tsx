import { Suspense } from "react";
import { PaymentToast } from "@/components/profile/PaymentToast";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfilePlansSection } from "@/components/profile/ProfilePlansSection";
import { SubscriptionManagement } from "@/components/profile/SubscriptionManagement";
import { getAuthContextLite } from "@/lib/get-auth-context-lite";
import { PLANS, type PlanKey } from "@/lib/plans";
import {
  getAllowedCallsLimit,
  callsLimitLine,
  getCallLimitState,
} from "@/lib/call-limits";
import {
  getAllowedManagersLimit,
  getManagerLimitState,
  managersLimitLine,
} from "@/lib/manager-limits";
import {
  deriveSubscriptionUi,
  formatRuDate,
  prismaPlanToPlanKey,
} from "@/lib/subscription-ui";
import { prisma } from "@/lib/prisma";
import type { Plan, Subscription } from "@prisma/client";
import { redirect } from "next/navigation";

type SubscriptionWithUsage = Subscription & {
  callsUsed?: number | null;
  managersUsed?: number | null;
};

export default async function ProfilePage() {
  const ctx = await getAuthContextLite();
  if (!ctx) {
    redirect("/login");
  }

  const { user, subscription } = ctx;
  const companyId = user.companyId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [callsUsed, managersUsed] = await Promise.all([
    companyId != null
      ? prisma.call.count({
          where: {
            companyId,
            createdAt: { gte: startOfMonth },
          },
        })
      : Promise.resolve(0),
    companyId != null
      ? prisma.manager.count({
          where: { companyId, isActive: true },
        })
      : Promise.resolve(0),
  ]);

  const subUsage = subscription as SubscriptionWithUsage | null | undefined;

  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planLabelKey = prismaPlanToPlanKey(plan);
  const planLabel = PLANS[planLabelKey]?.label ?? plan;

  const priceLine =
    plan === "TRIAL"
      ? "Бесплатно"
      : `${PLANS[planLabelKey].price.toLocaleString("ru-RU")} ₽/мес`;

  const allowedCalls = getAllowedCallsLimit(subscription);
  const callLimit = getCallLimitState(callsUsed, allowedCalls);
  const callsUsageLine = callLimit.unlimited
    ? "Без лимита"
    : callsLimitLine(callsUsed, callLimit.allowed!);
  const allowedManagers = getAllowedManagersLimit(subscription);
  const managerLimit = getManagerLimitState(managersUsed, allowedManagers);

  const trialEndsAt = subscription?.trialEndsAt ?? null;
  let trialDaysLeft = 0;
  if (plan === "TRIAL" && trialEndsAt) {
    trialDaysLeft = Math.max(
      0,
      Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000),
    );
  }

  const currentPeriodEnd = subscription?.currentPeriodEnd ?? null;

  const subscriptionUi = deriveSubscriptionUi({
    plan: planLabelKey,
    subStatus: subscription?.status,
    trialDaysLeft,
    currentPeriodEnd,
  });

  const trialDaysLeftDisplay =
    plan === "TRIAL" && trialEndsAt ? trialDaysLeft : null;

  const activeUntilLine =
    subscriptionUi.displayStatus === "active" && currentPeriodEnd
      ? `Активен до ${formatRuDate(new Date(currentPeriodEnd))}`
      : null;

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Личные данные</h2>
          <div className="mt-4">
            <ProfileForm name={user.name} email={user.email ?? ""} />
          </div>
        </section>

        <SubscriptionManagement
          planLabel={planLabel}
          priceLine={priceLine}
          displayStatus={subscriptionUi.displayStatus}
          statusLabel={subscriptionUi.statusLabel}
          trialDaysLeft={trialDaysLeftDisplay}
          activeUntilLine={activeUntilLine}
          showBanner={subscriptionUi.showBanner}
          bannerMessage={subscriptionUi.bannerMessage}
          ctaLabel={subscriptionUi.ctaLabel}
        />

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-zinc-100">Использование</h2>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p className={callLimit.atOrOverLimit ? "text-red-400" : undefined}>
              Звонки: {callsUsageLine}
            </p>
            {callLimit.warningMessage ? (
              <p className="text-sm text-red-400" role="alert">
                {callLimit.warningMessage}
              </p>
            ) : null}
            <p className={managerLimit.overLimit ? "text-red-400" : undefined}>
              Менеджеры:{" "}
              {managersLimitLine(
                subUsage?.managersUsed ?? managersUsed,
                allowedManagers,
              )}
            </p>
            {managerLimit.warningMessage ? (
              <p className="text-sm text-red-400" role="alert">
                {managerLimit.warningMessage}
              </p>
            ) : null}
          </div>
        </section>

        <Suspense fallback={null}>
          <ProfilePlansSection
            currentPlanKey={planLabelKey}
            showDashboardLink={
              subscriptionUi.displayStatus === "active" ||
              subscriptionUi.displayStatus === "trial"
            }
          />
        </Suspense>
      </div>
      <Suspense fallback={null}>
        <PaymentToast />
      </Suspense>
    </main>
  );
}
