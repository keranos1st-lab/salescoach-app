import { AppShell } from "@/components/app-shell";
import { createClerkSupabaseClient } from "@/lib/supabase-clerk";
import { ScoreTrendChart } from "@/app/dashboard/score-trend-chart";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const supabase = await createClerkSupabaseClient();

  const { data: callsRaw } = await supabase
    .from("calls")
    .select("created_at, score, managers ( id, name )")
    .order("created_at", { ascending: true });

  const calls = (callsRaw ?? []).map((row) => {
    const r = row as {
      created_at: string;
      score: number | null;
      managers?: { id: string; name: string } | { id: string; name: string }[] | null;
    };
    const managerValue = r.managers;
    const manager =
      managerValue == null
        ? null
        : Array.isArray(managerValue)
          ? managerValue[0] ?? null
          : managerValue;
    return {
      created_at: r.created_at,
      score: r.score,
      managerId: manager?.id ?? "no-manager",
      managerName: manager?.name ?? "Без менеджера",
    };
  });

  const managerStatsMap = new Map<
    string,
    { id: string; name: string; callsCount: number; scoreSum: number; scoreCount: number }
  >();
  const trendMap = new Map<string, { scoreSum: number; scoreCount: number }>();

  for (const call of calls) {
    const existing = managerStatsMap.get(call.managerId) ?? {
      id: call.managerId,
      name: call.managerName,
      callsCount: 0,
      scoreSum: 0,
      scoreCount: 0,
    };
    existing.callsCount += 1;
    if (typeof call.score === "number") {
      existing.scoreSum += call.score;
      existing.scoreCount += 1;
      const dateKey = call.created_at.slice(0, 10);
      const trendExisting = trendMap.get(dateKey) ?? { scoreSum: 0, scoreCount: 0 };
      trendExisting.scoreSum += call.score;
      trendExisting.scoreCount += 1;
      trendMap.set(dateKey, trendExisting);
    }
    managerStatsMap.set(call.managerId, existing);
  }

  const managerKpis = Array.from(managerStatsMap.values())
    .map((stat) => ({
      id: stat.id,
      name: stat.name,
      callsCount: stat.callsCount,
      avgScore:
        stat.scoreCount > 0
          ? Number((stat.scoreSum / stat.scoreCount).toFixed(1))
          : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const chartData = Array.from(trendMap.entries())
    .map(([date, stat]) => ({
      date,
      avgScore: Number((stat.scoreSum / stat.scoreCount).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell activeHref="/dashboard">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <header className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Обзор ключевых метрик по звонкам и команде
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold text-zinc-100">KPI менеджеров</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Количество звонков и средний балл по каждому менеджеру
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {managerKpis.length === 0 ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
                Нет данных по звонкам
              </div>
            ) : (
              managerKpis.map((manager) => (
                <ManagerKpiCard
                  key={manager.id}
                  id={manager.id}
                  name={manager.name}
                  callsCount={manager.callsCount}
                  avgScore={manager.avgScore}
                />
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-zinc-100">Динамика среднего балла</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Линейный график среднего балла по датам
          </p>
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <ScoreTrendChart data={chartData} />
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function scoreColor(avgScore: number | null) {
  if (avgScore == null) return "text-zinc-400";
  if (avgScore >= 80) return "text-emerald-400";
  if (avgScore >= 50) return "text-amber-400";
  return "text-red-400";
}

function ManagerKpiCard({
  id,
  name,
  callsCount,
  avgScore,
}: {
  id: string;
  name: string;
  callsCount: number;
  avgScore: number | null;
}) {
  const content = (
    <>
      <p className="truncate text-sm font-medium text-zinc-300">{name}</p>
      <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">Звонков</p>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-white">
        {callsCount}
      </p>
      <p className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
        Средний балл
      </p>
      <p className={`text-2xl font-semibold tabular-nums tracking-tight ${scoreColor(avgScore)}`}>
        {avgScore == null ? "—" : avgScore}
      </p>
    </>
  );

  if (id === "no-manager") {
    return <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg shadow-black/20">{content}</div>;
  }

  return (
    <Link
      href={`/managers/${id}`}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg shadow-black/20 transition hover:border-zinc-700"
    >
      {content}
    </Link>
  );
}
