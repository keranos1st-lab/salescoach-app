import { AppShell } from "@/components/app-shell";
import { authOptions } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ReportsWorkspace } from "@/app/reports/reports-workspace";

export type ReportManager = {
  id: string;
  name: string;
};

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const supabase = await createClient();

  const { data: managers } = await supabase
    .from("managers")
    .select("id, name")
    .order("name", { ascending: true });

  const managerOptions: ReportManager[] = (managers ?? []).map((m) => ({
    id: String(m.id),
    name: String(m.name),
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
              max-width: none;
              margin: 0;
              background: white !important;
              color: black !important;
              font-size: 12pt;
              padding: 0;
            }
            
            /* Убираем тёмные фоны и цвета */
            #print-report * {
              background: white !important;
              color: black !important;
              border-color: #ccc !important;
              box-shadow: none !important;
            }
            
            /* Не разрывать секции */
            #print-report .report-section,
            #print-report .report-article > section,
            #print-report .report-article > div {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            #print-report .report-article {
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            #print-report ul,
            #print-report li,
            #print-report p,
            #print-report h2,
            #print-report h3,
            #print-report h4 {
              break-inside: avoid;
              page-break-inside: avoid;
            }

            #print-report .report-section + .report-section {
              margin-top: 6mm;
            }
          }
        `}</style>
      </main>
    </AppShell>
  );
}
