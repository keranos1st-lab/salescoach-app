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
  planKeyToPrismaPlan,
} from "@/lib/manager-limits";
import type { Plan, SubStatus } from "@prisma/client";

export type SubscriptionStatusBarModel = {
  planLabel: string;
  termLine: string;
  callsLine: string;
  callsAtOrOverLimit: boolean;
  callsWarning: string | null;
  managersLine: string;
  managersOverLimit: boolean;
  managersWarning: string | null;
  ctaLabel: string;
  displayStatus: SubscriptionDisplayStatus;
  soonEnding: boolean;
};

export function formatRuDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
}

export function prismaPlanToPlanKey(plan: Plan): PlanKey {
  if (plan === "START") {
    return "STARTER";
  }
  return plan as PlanKey;
}

export function getProductAccessBlock(sub: {
  plan: PlanKey;
  subStatus: SubStatus | null | undefined;
  trialDaysLeft: number;
  currentPeriodEnd?: Date | null;
}): {
  blocked: boolean;
  title: string;
  message: string;
} {
  const ui = deriveSubscriptionUi(sub);

  if (!ui.showBanner) {
    return {
      blocked: false,
      title: "",
      message: "",
    };
  }

  const trialExpired = sub.plan === "TRIAL" && sub.trialDaysLeft === 0;
  const title = trialExpired ? "Пробный период закончился" : "Срок тарифа истёк";

  return {
    blocked: true,
    title,
    message: "Выберите тариф, чтобы продолжить пользоваться сервисом",
  };
}

export type SubscriptionDisplayStatus = "trial" | "active" | "expired" | "none";

export function deriveSubscriptionUi(sub: {
  plan: PlanKey;
  subStatus: SubStatus | null | undefined;
  trialDaysLeft: number;
  currentPeriodEnd?: Date | null;
}): {
  displayStatus: SubscriptionDisplayStatus;
  statusLabel: string;
  showBanner: boolean;
  bannerMessage: string;
  ctaLabel: string;
} {
  const { plan, subStatus, trialDaysLeft, currentPeriodEnd } = sub;
  const isTrialPlan = plan === "TRIAL";
  const isActivePaid = subStatus === "ACTIVE" && !isTrialPlan;
  const paidPeriodExpired =
    isActivePaid &&
    currentPeriodEnd != null &&
    new Date(currentPeriodEnd) < new Date();
  const effectivelyActivePaid = isActivePaid && !paidPeriodExpired;
  const trialExpired = isTrialPlan && trialDaysLeft === 0;
  const subExpired =
    subStatus === "EXPIRED" ||
    subStatus === "CANCELED" ||
    subStatus === "PAST_DUE";

  let displayStatus: SubscriptionDisplayStatus = "none";
  if (effectivelyActivePaid) {
    displayStatus = "active";
  } else if (isTrialPlan && trialDaysLeft > 0) {
    displayStatus = "trial";
  } else if (trialExpired || subExpired || paidPeriodExpired) {
    displayStatus = "expired";
  } else if (isTrialPlan) {
    displayStatus = "trial";
  }

  const statusLabels: Record<SubscriptionDisplayStatus, string> = {
    trial: "Пробный период",
    active: "Активна",
    expired: "Истекла",
    none: "Нет подписки",
  };

  let bannerMessage = "";
  if (trialExpired) {
    bannerMessage =
      "Пробный период закончился. Выберите тариф, чтобы продолжить работу.";
  } else if (paidPeriodExpired || (subExpired && !isTrialPlan)) {
    bannerMessage =
      "Срок тарифа закончился. Продлите подписку, чтобы сохранить доступ.";
  } else if (displayStatus === "none") {
    bannerMessage = "У вас нет активного тарифа. Выберите подходящий план.";
  }

  const showBanner =
    trialExpired || subExpired || paidPeriodExpired || displayStatus === "none";

  let ctaLabel = "Выбрать тариф";
  if (effectivelyActivePaid) {
    ctaLabel = "Сменить тариф";
  } else if (
    trialExpired ||
    paidPeriodExpired ||
    (subExpired && !isTrialPlan)
  ) {
    ctaLabel = "Продлить тариф";
  }

  return {
    displayStatus,
    statusLabel: statusLabels[displayStatus],
    showBanner,
    bannerMessage,
    ctaLabel,
  };
}

export function buildSubscriptionStatusBarModel(input: {
  plan: PlanKey;
  subStatus: SubStatus | null | undefined;
  trialDaysLeft: number;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  callsUsed: number;
  managersUsed: number;
  maxCalls?: number | null;
  maxManagers?: number | null;
}): SubscriptionStatusBarModel {
  const ui = deriveSubscriptionUi({
    plan: input.plan,
    subStatus: input.subStatus,
    trialDaysLeft: input.trialDaysLeft,
    currentPeriodEnd: input.currentPeriodEnd,
  });

  const planDef = PLANS[input.plan];
  const planLabel =
    ui.displayStatus === "none"
      ? "Нет тарифа"
      : input.plan === "TRIAL"
        ? "Пробный"
        : (planDef?.label ?? input.plan);

  const trialExpired = input.plan === "TRIAL" && input.trialDaysLeft === 0;
  const isActivePaid =
    input.subStatus === "ACTIVE" && input.plan !== "TRIAL";

  let termLine = "Нет активного тарифа";
  if (trialExpired) {
    termLine = "Пробный период истёк";
  } else if (ui.displayStatus === "expired" && !trialExpired) {
    termLine = "Тариф истёк";
  } else if (input.plan === "TRIAL" && input.trialDaysLeft > 0) {
    termLine = `Осталось ${input.trialDaysLeft} дн.`;
  } else if (isActivePaid && input.currentPeriodEnd) {
    termLine = `Активен до ${formatRuDate(input.currentPeriodEnd)}`;
  } else if (isActivePaid) {
    termLine = "Активен";
  }

  const subscriptionSource = {
    plan: planKeyToPrismaPlan(input.plan),
    maxManagers: input.maxManagers,
    maxCalls: input.maxCalls,
    status: input.subStatus,
  };

  const allowedCalls = getAllowedCallsLimit(subscriptionSource);
  const callLimit = getCallLimitState(input.callsUsed, allowedCalls);
  const allowedManagers = getAllowedManagersLimit(subscriptionSource);

  const callsLine = callLimit.unlimited
    ? "Без лимита"
    : callsLimitLine(input.callsUsed, callLimit.allowed!);

  const managerLimit = getManagerLimitState(
    input.managersUsed,
    allowedManagers,
  );

  const managersLine = managersLimitLine(
    input.managersUsed,
    allowedManagers,
  );

  const paidDaysLeft = input.currentPeriodEnd
    ? daysUntil(input.currentPeriodEnd)
    : null;
  const soonEnding =
    (input.plan === "TRIAL" &&
      input.trialDaysLeft > 0 &&
      input.trialDaysLeft <= 3) ||
    (isActivePaid &&
      paidDaysLeft !== null &&
      paidDaysLeft <= 3 &&
      paidDaysLeft >= 0);

  return {
    planLabel,
    termLine,
    callsLine,
    callsAtOrOverLimit: callLimit.atOrOverLimit,
    callsWarning: callLimit.warningMessage,
    managersLine,
    managersOverLimit: managerLimit.overLimit,
    managersWarning: managerLimit.warningMessage,
    ctaLabel: ui.ctaLabel,
    displayStatus: ui.displayStatus,
    soonEnding,
  };
}

export function computeTrialDaysLeft(
  plan: Plan,
  trialEndsAt: Date | null | undefined,
): number {
  if (plan !== "TRIAL" || !trialEndsAt) {
    return 0;
  }
  return daysUntil(new Date(trialEndsAt));
}
