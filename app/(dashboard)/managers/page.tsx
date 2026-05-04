import { ManagersWorkspace, type ManagerRow } from "./managers-workspace";
import { AppShell } from "@/components/app-shell";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ManagersPage() {
  const ctx = await getAuthContext();
  if (!ctx?.user.companyId) {
    redirect("/login");
  }

  const companyId = ctx.user.companyId;

  const managersRaw = await prisma.manager.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const managerIds = managersRaw.map((m) => m.id);
  const callsRaw =
    managerIds.length === 0
      ? []
      : await prisma.call.findMany({
          where: {
            companyId,
            managerId: { in: managerIds },
          },
          select: { managerId: true, score: true },
        });

  const stats = new Map<
    string,
    { count: number; scoreSum: number; scoreCount: number }
  >();
  for (const row of callsRaw) {
    const managerId = row.managerId ?? "";
    if (!managerId) continue;
    const next = stats.get(managerId) ?? { count: 0, scoreSum: 0, scoreCount: 0 };
    next.count += 1;
    if (typeof row.score === "number") {
      next.scoreSum += row.score;
      next.scoreCount += 1;
    }
    stats.set(managerId, next);
  }

  const initialManagers: ManagerRow[] = managersRaw.map((row) => {
    const rowStats = stats.get(row.id);
    const avgScore =
      rowStats && rowStats.scoreCount > 0
        ? Number((rowStats.scoreSum / rowStats.scoreCount).toFixed(1))
        : null;
    return {
      id: row.id,
      name: row.name,
      calls_count: rowStats?.count ?? 0,
      score_avg: avgScore,
      created_at: row.createdAt.toISOString(),
    };
  });

  return (
    <AppShell activeHref="/managers">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <ManagersWorkspace initialManagers={initialManagers} />
      </main>
    </AppShell>
  );
}
