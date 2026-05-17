import { PLANS, type PlanKey } from "@/lib/plans";
import { prismaPlanToPlanKey } from "@/lib/subscription-ui";
import type { Plan, SubStatus, Subscription } from "@prisma/client";

export function planKeyToPrismaPlan(planKey: PlanKey): Plan {
  if (planKey === "STARTER") {
    return "START";
  }
  return planKey as Plan;
}

export type SubscriptionLimitsSource = {
  plan: Plan;
  maxManagers?: number | null;
  maxCalls?: number | null;
  status?: SubStatus | null;
} | null;

/**
 * Effective manager cap for the current plan.
 * Paid ACTIVE plans use catalog limits (Starter = 1), not stale trial maxManagers in DB.
 */
export function getAllowedManagersLimit(
  subscription: SubscriptionLimitsSource | undefined,
): number {
  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planKey = prismaPlanToPlanKey(plan);
  const catalogLimit = PLANS[planKey].maxManagers;

  if (!subscription) {
    return catalogLimit;
  }

  // Paid plan in DB: catalog limit (ignore stale trial maxManagers left in subscription row)
  if (plan !== "TRIAL") {
    return catalogLimit;
  }

  return subscription.maxManagers ?? catalogLimit;
}

export type ManagerLimitState = {
  allowed: number;
  active: number;
  overLimit: boolean;
  atOrOverLimit: boolean;
  warningMessage: string | null;
  createBlockedMessage: string;
};

export function getManagerLimitState(
  activeCount: number,
  allowed: number,
): ManagerLimitState {
  const overLimit = activeCount > allowed;
  const atOrOverLimit = activeCount >= allowed;

  const warningMessage = overLimit
    ? `У вас ${activeCount} активных менеджеров, а текущий тариф позволяет только ${allowed}. Отключите лишних менеджеров или смените тариф.`
    : null;

  const createBlockedMessage = overLimit
    ? (warningMessage ??
      `Лимит менеджеров превышен (${activeCount} из ${allowed}).`)
    : `Достигнут лимит менеджеров по тарифу (${activeCount} из ${allowed}). Отключите менеджера или смените тариф.`;

  return {
    allowed,
    active: activeCount,
    overLimit,
    atOrOverLimit,
    warningMessage,
    createBlockedMessage,
  };
}

export function managersLimitLine(active: number, allowed: number): string {
  return `${active} из ${allowed}`;
}
