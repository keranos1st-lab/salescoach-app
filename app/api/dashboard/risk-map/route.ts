import { getAuthContextLite } from "@/lib/get-auth-context-lite";
import { prisma } from "@/lib/prisma";
import { parseRiskItems, riskLabel, toRiskItem } from "@/lib/report-risks";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export type RiskMapMentionDetail = {
  dates: string[];
};

export type RiskMapRiskRow = {
  risk_id: string;
  label: string;
  mentions: Record<string, number>;
  mention_dates: Record<string, RiskMapMentionDetail>;
  total: number;
};

export type RiskMapResponse = {
  managers: string[];
  risks: RiskMapRiskRow[];
  has_data: boolean;
  period_days: number;
};

function emptyMentions(managers: string[]): Record<string, number> {
  return Object.fromEntries(managers.map((name) => [name, 0]));
}

function emptyMentionDates(
  managers: string[],
): Record<string, RiskMapMentionDetail> {
  return Object.fromEntries(managers.map((name) => [name, { dates: [] }]));
}

/**
 * Сигналы рисков из звонков за период (negatives → risk_id).
 * Отчёты в БД не сохраняются; используются те же risk_id, что в manager report.
 */
export async function GET() {
  const ctx = await getAuthContextLite();
  if (!ctx?.user.companyId) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const companyId = ctx.user.companyId;
  const periodDays = 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - (periodDays - 1));
  fromDate.setHours(0, 0, 0, 0);

  const [managersRaw, callsRaw] = await Promise.all([
    prisma.manager.findMany({
      where: { companyId, isActive: true },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    prisma.call.findMany({
      where: {
        companyId,
        excluded: false,
        createdAt: { gte: fromDate },
      },
      select: {
        createdAt: true,
        negatives: true,
        nextTask: true,
        manager: { select: { name: true } },
      },
    }),
  ]);

  const managers = managersRaw.map((m) => m.name);
  if (managers.length === 0) {
    const body: RiskMapResponse = {
      managers: [],
      risks: [],
      has_data: false,
      period_days: periodDays,
    };
    return NextResponse.json(body);
  }

  type Cell = { count: number; dates: Set<string> };
  const matrix = new Map<string, Map<string, Cell>>();

  const bump = (riskId: string, managerName: string, dateKey: string) => {
    if (!managers.includes(managerName)) return;
    if (!matrix.has(riskId)) matrix.set(riskId, new Map());
    const row = matrix.get(riskId)!;
    if (!row.has(managerName)) {
      row.set(managerName, { count: 0, dates: new Set() });
    }
    const cell = row.get(managerName)!;
    cell.count += 1;
    cell.dates.add(dateKey);
  };

  let signalCount = 0;

  for (const call of callsRaw) {
    const managerName = call.manager?.name?.trim();
    if (!managerName || !managers.includes(managerName)) continue;

    const dateKey = call.createdAt.toISOString().slice(0, 10);

    for (const item of parseRiskItems(call.negatives)) {
      bump(item.risk_id, managerName, dateKey);
      signalCount += 1;
    }

    const nextTask = call.nextTask?.trim();
    if (nextTask && /нет следующего|не зафиксир|размыт/i.test(nextTask)) {
      bump(toRiskItem(nextTask, "next_steps_unclear").risk_id, managerName, dateKey);
      signalCount += 1;
    }
  }

  const risks: RiskMapRiskRow[] = [];

  for (const [riskId, row] of matrix.entries()) {
    const mentions = emptyMentions(managers);
    const mention_dates = emptyMentionDates(managers);
    let total = 0;

    for (const managerName of managers) {
      const cell = row.get(managerName);
      const count = cell?.count ?? 0;
      mentions[managerName] = count;
      total += count;
      mention_dates[managerName] = {
        dates: cell
          ? Array.from(cell.dates).sort((a, b) => b.localeCompare(a))
          : [],
      };
    }

    if (total > 0) {
      risks.push({
        risk_id: riskId,
        label: riskLabel(riskId),
        mentions,
        mention_dates,
        total,
      });
    }
  }

  risks.sort((a, b) => b.total - a.total);

  const body: RiskMapResponse = {
    managers,
    risks,
    has_data: signalCount > 0,
    period_days: periodDays,
  };

  return NextResponse.json(body);
}
