import { AppShell } from "@/components/app-shell";
import { ReportsWorkspace } from "./reports-workspace";
import { getAuthContext } from "@/lib/get-auth-context";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export type ReportManager = {
  id: string;
  name: string;
};

export default async function ReportsPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }
  const companyId = ctx.user.companyId;
  if (!companyId) {
    redirect("/login");
  }

  const managers = await prisma.manager.findMany({
    where: { companyId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const managerOptions: ReportManager[] = managers.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  return (
    <AppShell activeHref="/reports">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-8">
        <ReportsWorkspace managers={managerOptions} />
        <style>{`
          @media print {
            @page {
              size: A4;
              margin: 14mm;
            }

            /* Скрываем всё кроме отчёта */
            body * { visibility: hidden; }
            
            /* Показываем только блок отчёта */
            #print-report, #print-report * { visibility: visible; }
            
            #print-report {
              position: static;
              display: block;
              width: auto;
              margin: 0;
              padding: 0;
            }
          }
        `}</style>
      </main>
    </AppShell>
  );
}
