import { getCompanyUsageCounts } from "@/lib/company-usage";
import type { SubscriptionLimitsSource } from "@/lib/manager-limits";
import { PLANS, type PlanKey } from "@/lib/plans";
import type { Plan } from "@prisma/client";

function prismaPlanToPlanKey(plan: Plan): PlanKey {
  if (plan === "START") {
    return "STARTER";
  }
  return plan as PlanKey;
}

export type CallLimitPhase = "underLimit" | "atLimit" | "overLimit" | "unlimited";

export type CallLimitState = {
  unlimited: boolean;
  allowed: number | null;
  used: number;
  phase: CallLimitPhase;
  /** Block new call upload/analysis when used >= allowed */
  atOrOverLimit: boolean;
  overLimit: boolean;
  warningMessage: string | null;
  createBlockedMessage: string;
};

/**
 * Monthly call cap; `null` = без лимита (например BUSINESS).
 * Paid plans use catalog limits, not stale trial maxCalls in DB.
 */
export function getAllowedCallsLimit(
  subscription: SubscriptionLimitsSource | undefined,
): number | null {
  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planKey = prismaPlanToPlanKey(plan);
  const catalogLimit = PLANS[planKey].maxCalls;

  if (!subscription) {
    return catalogLimit;
  }

  if (plan !== "TRIAL") {
    return catalogLimit;
  }

  return subscription.maxCalls ?? catalogLimit;
}

export function getCallLimitState(
  usedCount: number,
  allowed: number | null,
): CallLimitState {
  if (allowed == null) {
    return {
      unlimited: true,
      allowed: null,
      used: usedCount,
      phase: "unlimited",
      atOrOverLimit: false,
      overLimit: false,
      warningMessage: null,
      createBlockedMessage: "",
    };
  }

  const overLimit = usedCount > allowed;
  const atLimit = usedCount === allowed;
  const atOrOverLimit = usedCount >= allowed;

  let warningMessage: string | null = null;
  if (overLimit) {
    warningMessage = `У вас использовано ${usedCount} звонков из ${allowed} по текущему тарифу. Выберите другой тариф, чтобы продолжить анализ.`;
  } else if (atLimit) {
    warningMessage = `Достигнут лимит звонков по тарифу (${usedCount} из ${allowed}). Выберите другой тариф, чтобы загрузить новый звонок.`;
  }

  const createBlockedMessage = overLimit
    ? (warningMessage ??
      `Лимит звонков превышен (${usedCount} из ${allowed}).`)
    : `Достигнут лимит звонков по тарифу (${usedCount} из ${allowed}). Выберите другой тариф, чтобы загрузить новый звонок.`;

  let phase: CallLimitPhase = "underLimit";
  if (overLimit) {
    phase = "overLimit";
  } else if (atLimit) {
    phase = "atLimit";
  }

  return {
    unlimited: false,
    allowed,
    used: usedCount,
    phase,
    atOrOverLimit,
    overLimit,
    warningMessage,
    createBlockedMessage,
  };
}

export function callsLimitLine(used: number, allowed: number): string {
  return `Загружено ${used} из ${allowed}`;
}

export async function getMonthlyCallLimitStateForCompany(
  companyId: string,
  subscription: SubscriptionLimitsSource | undefined,
): Promise<CallLimitState> {
  const { callsUsed } = await getCompanyUsageCounts(companyId);
  return getCallLimitState(callsUsed, getAllowedCallsLimit(subscription));
}
