import type { PlanKey } from "@/lib/plans";
import type { SubStatus } from "@prisma/client";

export type SubscriptionDisplayStatus = "trial" | "active" | "expired" | "none";

export function deriveSubscriptionUi(sub: {
  plan: PlanKey;
  subStatus: SubStatus | null | undefined;
  trialDaysLeft: number;
}): {
  displayStatus: SubscriptionDisplayStatus;
  statusLabel: string;
  showBanner: boolean;
  bannerMessage: string;
  ctaLabel: string;
} {
  const { plan, subStatus, trialDaysLeft } = sub;
  const isTrialPlan = plan === "TRIAL";
  const isActivePaid = subStatus === "ACTIVE" && !isTrialPlan;
  const trialExpired = isTrialPlan && trialDaysLeft === 0;
  const subExpired =
    subStatus === "EXPIRED" ||
    subStatus === "CANCELED" ||
    subStatus === "PAST_DUE";

  let displayStatus: SubscriptionDisplayStatus = "none";
  if (isActivePaid) {
    displayStatus = "active";
  } else if (isTrialPlan && trialDaysLeft > 0) {
    displayStatus = "trial";
  } else if (trialExpired || subExpired) {
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
  } else if (subExpired && !isTrialPlan) {
    bannerMessage =
      "Срок тарифа закончился. Продлите подписку, чтобы сохранить доступ.";
  } else if (displayStatus === "none") {
    bannerMessage = "У вас нет активного тарифа. Выберите подходящий план.";
  }

  const showBanner = trialExpired || subExpired || displayStatus === "none";

  let ctaLabel = "Выбрать тариф";
  if (isActivePaid) {
    ctaLabel = "Сменить тариф";
  } else if (trialExpired || (subExpired && !isTrialPlan)) {
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
