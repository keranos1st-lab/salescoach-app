import type { User as PrismaUser } from "@prisma/client";
import { Role } from "@prisma/client";
import { getCachedSession } from "@/lib/cached-session";
import type { AuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";

/**
 * Like `getAuthContext` but does not load `company.managers` (avoids nested manager list query).
 * `managers` is always `[]` — use full `getAuthContext` when you need the real list.
 */
export async function getAuthContextLite(): Promise<AuthContext | null> {
  const session = await getCachedSession();
  if (!session?.user?.id) {
    return null;
  }

  const sessionUserId = session.user.id;
  const roleStr = session.user.role;

  if (roleStr === "MANAGER") {
    const manager = await prisma.manager.findFirst({
      where: { id: sessionUserId, isActive: true },
      include: {
        company: {
          include: {
            subscription: true,
          },
        },
      },
    });
    if (!manager?.company) {
      return null;
    }

    const subscription = manager.company.subscription;

    const subscriptionStatus =
      subscription?.status === "ACTIVE"
        ? "active"
        : subscription?.status === "TRIAL"
          ? "trial"
          : subscription
            ? "expired"
            : "trial";

    const user = {
      id: manager.id,
      email: manager.email ?? "",
      name: manager.name,
      passwordHash: null,
      role: Role.MANAGER,
      subscriptionStatus,
      trialEndsAt: subscription?.trialEndsAt ?? null,
      subscriptionEndsAt: subscription?.currentPeriodEnd ?? null,
      createdAt: manager.createdAt,
      updatedAt: manager.createdAt,
      companyId: manager.companyId,
      company: manager.company,
      managedIn: [],
      subscription: null,
    } as PrismaUser & {
      company: NonNullable<typeof manager.company>;
    };

    return { user, managers: [], subscription } as unknown as AuthContext;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      company: {
        include: {
          subscription: true,
        },
      },
      subscription: true,
    },
  });

  if (!user) {
    return null;
  }

  const subscription =
    user.company?.subscription ?? user.subscription ?? null;

  return { user, managers: [], subscription } as unknown as AuthContext;
}
