import { CallsWorkspace, type CallListItem } from "./calls-workspace";
import { AppShell } from "@/components/app-shell";
import { companyProfileFromJson } from "@/lib/company-profile";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CallsPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  const companyId = ctx.user.companyId;
  if (!companyId) {
    redirect("/login");
  }
  const userId = ctx.user.id;

  const managers = await prisma.manager.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const callsRaw = await prisma.call.findMany({
    where: { companyId },
    include: { manager: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { profile: true },
  });
  const profile = company?.profile
    ? companyProfileFromJson(company.profile, userId)
    : null;
  const productContext =
    profile?.manual_description?.trim() ||
    profile?.parsed_text?.trim() ||
    "";
  const contextPreview =
    productContext.length > 100
      ? `${productContext.slice(0, 100).trim()}...`
      : productContext;

  const initialCalls: CallListItem[] = callsRaw.map((row) => ({
    id: row.id,
    created_at: row.createdAt.toISOString(),
    score: row.score,
    transcript: row.transcript,
    positives: null,
    negatives: null,
    next_task: null,
    audio_url: row.audioUrl,
    managers: row.manager ? { name: row.manager.name } : null,
  }));

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
          managers={managers}
          initialCalls={initialCalls}
        />
      </main>
    </AppShell>
  );
}
