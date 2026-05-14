"use client";

import { useEffect, useState } from "react";
import type { PlanKey } from "@/lib/plans";

function planKeyMatchesServerPlan(planKey: PlanKey, serverPlan: string | null) {
  if (!serverPlan) return false;
  if (planKey === "STARTER") return serverPlan === "START";
  return planKey === serverPlan;
}

export function CurrentPlanBadge({ planKey }: { planKey: PlanKey }) {
  const [plan, setPlan] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/plan", { credentials: "include" })
      .then((r) => r.json() as Promise<{ plan?: string | null }>)
      .then((data) => {
        if (!cancelled) setPlan(data.plan ?? null);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (plan === undefined) return null;
  if (!planKeyMatchesServerPlan(planKey, plan)) return null;

  return (
    <span className="rounded-full bg-teal-600/30 px-2.5 py-1 text-xs font-semibold text-teal-200">
      Текущий
    </span>
  );
}
