import { PLANS, type PlanKey } from "@/lib/plans";
import { prismaPlanToPlanKey } from "@/lib/subscription-ui";
import type { Plan, Subscription } from "@prisma/client";

export function getAllowedManagersLimit(
  subscription: Pick<Subscription, "plan" | "maxManagers"> | null | undefined,
): number {
  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planKey = prismaPlanToPlanKey(plan);
  return subscription?.maxManagers ?? PLANS[planKey].maxManagers;
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
