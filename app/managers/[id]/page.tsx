import { AppShell } from "@/components/app-shell";
import { ScoreTrendChart } from "@/app/dashboard/score-trend-chart";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

type CallRow = {
  id: string;
  created_at: string;
  score: number | null;
  next_task: string | null;
};

function scoreColor(score: number | null) {
  if (score == null) return "text-zinc-400";
  if (score >= 80) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export default async function ManagerDetailsPage(props: PageProps) {
  const { id } = await props.params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: managerRaw } = await supabase
    .from("managers")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (!managerRaw) {
    notFound();
  }

  const { data: callsRaw } = await supabase
    .from("calls")
    .select("id, created_at, score, next_task")
    .eq("manager_id", id)
    .order("created_at", { ascending: false });

  const calls: CallRow[] = (callsRaw ?? []).map((row) => ({
    id: String(row.id),
    created_at: String(row.created_at),
    score: row.score ?? null,
    next_task: row.next_task ?? null,
  }));

  const scored = calls.filter((c) => typeof c.score === "number");
  const avgScore =
    scored.length > 0
      ? Number((scored.reduce((sum, c) => sum + (c.score ?? 0), 0) / scored.length).toFixed(1))
      : null;

  const trendMap = new Map<string, { sum: number; count: number }>();
  for (const call of scored) {
    const dateKey = call.created_at.slice(0, 10);
    const existing = trendMap.get(dateKey) ?? { sum: 0, count: 0 };
    existing.sum += call.score ?? 0;
    existing.count += 1;
    trendMap.set(dateKey, existing);
  }
  const chartData = Array.from(trendMap.entries())
    .map(([date, stat]) => ({
      date,
      avgScore: Number((stat.sum / stat.count).toFixed(1)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <AppShell activeHref="/managers">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <header>
            <Link href="/managers" className="text-sm text-[#5eead4] hover:text-[#2dd4bf]">
              ← Назад к менеджерам
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">{managerRaw.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">Персональная статистика менеджера</p>
          </header>

          <section className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Звонков" value={calls.length} />
            <MetricCard title="Средний балл" value={avgScore == null ? "—" : avgScore} valueClass={scoreColor(avgScore)} />
            <MetricCard title="Звонков с оценкой" value={scored.length} />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">Динамика баллов</h2>
            <p className="mt-1 text-sm text-zinc-500">Средний балл по датам</p>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
              <ScoreTrendChart data={chartData} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-100">Звонки менеджера</h2>
            <p className="mt-1 text-sm text-zinc-500">Дата, балл и задача на следующий звонок</p>
            <ul className="mt-4 space-y-3">
              {calls.length === 0 ? (
                <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
                  У этого менеджера пока нет звонков
                </li>
              ) : (
                calls.map((call) => (
                  <li
                    key={call.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-zinc-500">
                        {new Date(call.created_at).toLocaleString("ru-RU")}
                      </p>
                      <p className={`text-sm font-semibold tabular-nums ${scoreColor(call.score)}`}>
                        Балл: {call.score ?? "—"}
                      </p>
                    </div>
                    <div className="mt-3 rounded-lg border border-[#0d9488]/25 bg-[#0d9488]/10 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5eead4]">
                        Задача на следующий звонок
                      </p>
                      <p className="mt-1 text-sm text-zinc-200">{call.next_task || "—"}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </AppShell>
  );
}

function MetricCard({
  title,
  value,
  valueClass = "text-white",
}: {
  title: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-lg shadow-black/20">
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className={`mt-3 text-3xl font-semibold tabular-nums tracking-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}
