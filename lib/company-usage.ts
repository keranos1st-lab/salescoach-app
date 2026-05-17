import { prisma } from "@/lib/prisma";

/** Monthly call count and active managers for subscription limits display. */
export async function getCompanyUsageCounts(companyId: string | null) {
  if (!companyId) {
    return { callsUsed: 0, managersUsed: 0 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [callsUsed, managersUsed] = await Promise.all([
    prisma.call.count({
      where: {
        companyId,
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.manager.count({
      where: { companyId, isActive: true },
    }),
  ]);

  return { callsUsed, managersUsed };
}
