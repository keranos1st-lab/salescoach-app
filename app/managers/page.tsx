import { ManagersWorkspace, type ManagerRow } from "@/app/managers/managers-workspace";
import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function ManagersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: managersRaw } = await supabase
    .from("managers")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  const managerIds = (managersRaw ?? []).map((m) => String(m.id));
  const { data: callsRaw } =
    managerIds.length === 0
      ? { data: [] }
      : await supabase
          .from("calls")
          .select("manager_id, score")
          .in("manager_id", managerIds);

  const stats = new Map<string, { count: number; scoreSum: number; scoreCount: number }>();
  for (const row of callsRaw ?? []) {
    const managerId = String(row.manager_id ?? "");
    if (!managerId) continue;
    const next = stats.get(managerId) ?? { count: 0, scoreSum: 0, scoreCount: 0 };
    next.count += 1;
    if (typeof row.score === "number") {
      next.scoreSum += row.score;
      next.scoreCount += 1;
    }
    stats.set(managerId, next);
  }

  const initialManagers: ManagerRow[] = (managersRaw ?? []).map((row) => {
    const managerId = String(row.id);
    const rowStats = stats.get(managerId);
    const avgScore =
      rowStats && rowStats.scoreCount > 0
        ? Number((rowStats.scoreSum / rowStats.scoreCount).toFixed(1))
        : null;
    return {
      id: managerId,
      name: String(row.name),
      calls_count: rowStats?.count ?? 0,
      score_avg: avgScore,
      created_at: String(row.created_at),
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
