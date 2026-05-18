import type { SubscriptionLimitsSource } from "@/lib/manager-limits";
import {
  computeTrialDaysLeft,
  getProductAccessBlock,
  prismaPlanToPlanKey,
} from "@/lib/subscription-ui";
import type { Plan } from "@prisma/client";

export type ProductAccessDenied = {
  status: 403;
  message: string;
};

export function isProductAccessDenied(
  error: unknown,
): error is ProductAccessDenied {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as ProductAccessDenied).status === 403 &&
    "message" in error &&
    typeof (error as ProductAccessDenied).message === "string"
  );
}

export function assertProductAccess(
  subscription: SubscriptionLimitsSource | undefined,
): void {
  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const block = getProductAccessBlock({
    plan: prismaPlanToPlanKey(plan),
    subStatus: subscription?.status,
    trialDaysLeft: computeTrialDaysLeft(plan, subscription?.trialEndsAt),
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  });

  if (block.blocked) {
    throw { status: 403, message: block.message } satisfies ProductAccessDenied;
  }
}
