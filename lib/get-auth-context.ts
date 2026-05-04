import type { User as PrismaUser } from "@prisma/client";
import { Role } from "@prisma/client";
import { getCachedSession } from "@/lib/cached-session";
import { prisma } from "@/lib/prisma";

export async function getAuthContext() {
  const session = await getCachedSession();
  if (!session?.user?.id) return null;

  const sessionUserId = session.user.id;
  const roleStr = session.user.role;

  if (roleStr === "MANAGER") {
    const manager = await prisma.manager.findFirst({
      where: { id: sessionUserId, isActive: true },
      include: {
        company: {
          include: {
            managers: { where: { isActive: true } },
            subscription: true,
          },
        },
      },
    });
    if (!manager?.company) return null;

    const managers = manager.company.managers;
    const subscription = manager.company.subscription;

    const user = {
      id: manager.id,
      email: manager.email ?? "",
      name: manager.name,
      passwordHash: null,
      role: Role.MANAGER,
      createdAt: manager.createdAt,
      updatedAt: manager.createdAt,
      companyId: manager.companyId,
      company: manager.company,
      managedIn: [],
      subscription: null,
    } as PrismaUser & {
      company: NonNullable<typeof manager.company>;
    };

    return { user, managers, subscription };
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    include: {
      company: {
        include: {
          managers: { where: { isActive: true } },
          subscription: true,
        },
      },
      subscription: true,
    },
  });

  if (!user) return null;

  const managers = user.company?.managers ?? [];
  const subscription =
    user.company?.subscription ?? user.subscription ?? null;

  return { user, managers, subscription };
}

export type AuthContext = NonNullable<Awaited<ReturnType<typeof getAuthContext>>>;
