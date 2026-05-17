import { AuthSessionProvider } from "@/components/session-provider";
import { SubscriptionAccessGate } from "@/components/subscription-access-gate";
import { getCachedSession } from "@/lib/cached-session";
import { getAuthContextLite } from "@/lib/get-auth-context-lite";
import {
  computeTrialDaysLeft,
  getProductAccessBlock,
  prismaPlanToPlanKey,
} from "@/lib/subscription-ui";
import type { Plan } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const revalidate = 30;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await headers();
  const session = await getCachedSession();

  if (!session?.user) {
    redirect("/login");
  }

  const ctx = await getAuthContextLite();
  const subscription = ctx?.subscription ?? null;
  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planKey = prismaPlanToPlanKey(plan);

  const trialDaysLeft = computeTrialDaysLeft(plan, subscription?.trialEndsAt);

  const access = getProductAccessBlock({
    plan: planKey,
    subStatus: subscription?.status,
    trialDaysLeft,
  });

  return (
    <AuthSessionProvider>
      <SubscriptionAccessGate
        blocked={access.blocked}
        title={access.title}
        message={access.message}
      >
        {children}
      </SubscriptionAccessGate>
    </AuthSessionProvider>
  );
}
