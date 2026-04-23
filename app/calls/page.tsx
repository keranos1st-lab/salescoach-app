import { CallsWorkspace, type CallListItem } from "@/app/calls/calls-workspace";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CallsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: managers } = await supabase
    .from("managers")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: callsRaw } = await supabase
    .from("calls")
    .select(
      "id, created_at, score, transcript, positives, negatives, next_task, audio_url, managers!inner ( name )"
    )
    .order("created_at", { ascending: false });

  const { data: companyProfile } = await supabase
    .from("company_profile")
    .select("manual_description, parsed_text")
    .eq("user_id", user.id)
    .maybeSingle();
  const productContext =
    companyProfile?.manual_description?.trim() ||
    companyProfile?.parsed_text?.trim() ||
    "";
  const contextPreview =
    productContext.length > 100
      ? `${productContext.slice(0, 100).trim()}...`
      : productContext;

  const initialCalls: CallListItem[] = (callsRaw ?? []).map((row) => {
    const r = row as unknown as CallListItem & {
      managers?: { name: string } | { name: string }[] | null;
    };
    const m = r.managers;
    const manager =
      m == null
        ? null
        : Array.isArray(m)
          ? m[0] ?? null
          : m;
    return {
      id: r.id,
      created_at: r.created_at,
      score: r.score,
      transcript: r.transcript,
      positives: r.positives,
      negatives: r.negatives,
      next_task: r.next_task,
      audio_url: r.audio_url,
      managers: manager,
    };
  });

  return (
    <AppShell activeHref="/calls">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <section className="mx-auto mb-6 w-full max-w-4xl">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Контекст анализа
          </h2>
          {productContext ? (
            <div className="mt-2 rounded-xl border border-emerald-800/60 bg-emerald-950/20 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  ✓ Продукт настроен
                </span>
                <p className="min-w-0 flex-1 text-sm text-zinc-200">{contextPreview}</p>
                <Link href="/product" className="text-sm font-medium text-[#5eead4] hover:text-[#2dd4bf]">
                  Изменить
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-2 rounded-xl border border-amber-800/60 bg-amber-950/20 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
                  ⚠ Продукт не настроен — анализ без контекста
                </span>
                <Link
                  href="/product"
                  className="rounded-lg border border-amber-700/70 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-900/40"
                >
                  Настроить
                </Link>
              </div>
            </div>
          )}
        </section>
        <CallsWorkspace
          managers={managers ?? []}
          initialCalls={initialCalls}
        />
      </main>
    </AppShell>
  );
}
