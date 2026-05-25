import { LogoutButton } from "@/app/(dashboard)/dashboard/logout-button";
import { AppShellNav } from "@/components/app-shell-nav";
import { SubscriptionStatusBar } from "@/components/subscription-status-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { WelcomeOnboardingBanner } from "@/components/welcome-onboarding-banner";
import {
  companyProfileFromJson,
  emptyCompanyProfile,
  isCompanyProfileFilled,
} from "@/lib/company-profile";
import { getCompanyUsageCounts } from "@/lib/company-usage";
import { getCachedSession } from "@/lib/cached-session";
import { getAuthContextLite } from "@/lib/get-auth-context-lite";
import { prisma } from "@/lib/prisma";
import {
  buildSubscriptionStatusBarModel,
  computeTrialDaysLeft,
  prismaPlanToPlanKey,
} from "@/lib/subscription-ui";
import type { Plan } from "@prisma/client";
import Link from "next/link";

export async function AppShell({
  activeHref,
  children,
}: {
  activeHref: string;
  children: React.ReactNode;
}) {
  const session = await getCachedSession();
  const userTitle =
    session?.user?.name?.trim() ||
    session?.user?.email?.trim() ||
    "Пользователь";

  const ctx = await getAuthContextLite();
  const subscription = ctx?.subscription ?? null;
  const plan = subscription?.plan ?? ("TRIAL" as Plan);
  const planKey = prismaPlanToPlanKey(plan);
  const trialDaysLeft = computeTrialDaysLeft(plan, subscription?.trialEndsAt);

  const { callsUsed, managersUsed } = await getCompanyUsageCounts(
    ctx?.user.companyId ?? null,
  );

  const statusBar = buildSubscriptionStatusBarModel({
    plan: planKey,
    subStatus: subscription?.status,
    trialDaysLeft,
    trialEndsAt: subscription?.trialEndsAt ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    callsUsed,
    managersUsed,
    maxCalls: subscription?.maxCalls,
    maxManagers: subscription?.maxManagers,
  });

  const companyId = ctx?.user.companyId ?? null;
  const userId = ctx?.user.id ?? session?.user?.id ?? "";
  let productFilled = false;
  if (companyId && userId) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { profile: true },
    });
    const profile = company?.profile
      ? companyProfileFromJson(company.profile, userId)
      : emptyCompanyProfile(userId);
    productFilled = isCompanyProfileFilled(profile);
  }

  return (
    <div className="flex h-screen min-h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <aside className="app-shell-sidebar no-print flex h-full min-h-0 w-56 shrink-0 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-900/40">
        <div className="shrink-0 border-b border-zinc-800 px-4 py-5">
          <Link
            href="/dashboard"
            className="brand-logo text-lg font-semibold tracking-tight"
          >
            SalesCoach{" "}
            <span className="text-[#0d9488]">AI</span>
          </Link>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <AppShellNav activeHref={activeHref} productFilled={productFilled} />
        </nav>
        <div className="shrink-0 space-y-3 border-t border-zinc-800 p-3">
          <SubscriptionStatusBar {...statusBar} />
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-xs text-zinc-400">
              {userTitle}
            </p>
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <WelcomeOnboardingBanner showWhenProductEmpty={!productFilled} />
        {children}
      </div>
    </div>
  );
}
