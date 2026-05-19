export const PLAN_FEATURES = {
  starter: { riskMap: false, riskTrend: false, reports: true },
  standard: { riskMap: true, riskTrend: false, reports: true },
  pro: { riskMap: true, riskTrend: true, reports: true },
  business: { riskMap: true, riskTrend: true, reports: true },
} as const;

export type PlanKey = keyof typeof PLAN_FEATURES;

function resolvePlanFeatureKey(plan: string): PlanKey {
  const normalized = plan.trim().toLowerCase();
  if (normalized === "start" || normalized === "starter") return "starter";
  if (normalized === "standard") return "standard";
  if (normalized === "pro") return "pro";
  if (normalized === "business") return "business";
  if (normalized === "trial") return "starter";
  return "starter";
}

export function getPlanFeatures(plan: string) {
  const key = resolvePlanFeatureKey(plan);
  return PLAN_FEATURES[key] ?? PLAN_FEATURES.starter;
}
