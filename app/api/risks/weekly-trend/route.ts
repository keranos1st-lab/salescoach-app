import { getAuthContextLite } from "@/lib/get-auth-context-lite";
import { getPlanFeatures } from "@/lib/plan-features";
import { formatWeekShortLabel, getIsoWeekKey, lastIsoWeekKeys } from "@/lib/iso-week";
import { prisma } from "@/lib/prisma";
import {
  extractCallRiskIds,
  riskLabel,
  REPORT_RISK_IDS,
} from "@/lib/report-risks";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export type WeeklyRiskTrendSeries = {
  risk_id: string;
  label: string;
  data: number[];
};

export type WeeklyRiskTrendResponse = {
  weeks: string[];
  week_labels: string[];
  series: WeeklyRiskTrendSeries[];
  has_data: boolean;
  weeks_requested: number;
};

function parseWeeksParam(value: string | null): number {
  const n = Number.parseInt(value ?? "8", 10);
  if (!Number.isFinite(n)) return 8;
  return Math.min(12, Math.max(1, n));
}

/**
 * Тренд рисков по ISO-неделям.
 * Источник risk_id: Call.negatives (+ nextTask, analysisJson.risks при наличии).
 */
export async function GET(request: NextRequest) {
  const ctx = await getAuthContextLite();
  if (!ctx?.user.companyId) {
    return NextResponse.json({ error: "Нужна авторизация" }, { status: 401 });
  }

  const plan = ctx.subscription?.plan ?? "START";
  const features = getPlanFeatures(plan);
  if (!features.riskTrend) {
    return NextResponse.json({ error: "Upgrade required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const weeksRequested = parseWeeksParam(searchParams.get("weeks"));
  const teamId = searchParams.get("teamId")?.trim();

  const companyId = ctx.user.companyId;
  if (teamId && teamId !== companyId) {
    return NextResponse.json({ error: "Недопустимый teamId" }, { status: 400 });
  }

  const weekKeys = lastIsoWeekKeys(weeksRequested);
  const oldestWeek = weekKeys[0];
  if (!oldestWeek) {
    const empty: WeeklyRiskTrendResponse = {
      weeks: [],
      week_labels: [],
      series: [],
      has_data: false,
      weeks_requested: weeksRequested,
    };
    return NextResponse.json(empty);
  }

  const fromDate = weekStartDate(oldestWeek);
  fromDate.setHours(0, 0, 0, 0);

  const calls = await prisma.call.findMany({
    where: {
      companyId,
      excluded: false,
      createdAt: { gte: fromDate },
    },
    select: {
      id: true,
      createdAt: true,
      negatives: true,
      nextTask: true,
      analysisJson: true,
    },
  });

  /** weekKey → risk_id → call ids */
  const matrix = new Map<string, Map<string, Set<string>>>();

  for (const call of calls) {
    const weekKey = getIsoWeekKey(call.createdAt);
    if (!weekKeys.includes(weekKey)) continue;

    const riskIds = extractCallRiskIds(
      call.negatives,
      call.nextTask,
      call.analysisJson,
    );
    if (riskIds.length === 0) continue;

    if (!matrix.has(weekKey)) matrix.set(weekKey, new Map());
    const weekRow = matrix.get(weekKey)!;

    for (const riskId of riskIds) {
      if (!weekRow.has(riskId)) weekRow.set(riskId, new Set());
      weekRow.get(riskId)!.add(call.id);
    }
  }

  const activeRiskIds = new Set<string>();
  for (const weekRow of matrix.values()) {
    for (const [riskId, callIds] of weekRow.entries()) {
      if (callIds.size > 0) activeRiskIds.add(riskId);
    }
  }

  const orderedRiskIds = REPORT_RISK_IDS.filter((id) => activeRiskIds.has(id));
  for (const id of activeRiskIds) {
    if (!orderedRiskIds.includes(id)) orderedRiskIds.push(id);
  }

  const series: WeeklyRiskTrendSeries[] = orderedRiskIds.map((risk_id) => {
    const data = weekKeys.map((weekKey) => {
      const count = matrix.get(weekKey)?.get(risk_id)?.size ?? 0;
      return count;
    });
    return {
      risk_id,
      label: riskLabel(risk_id),
      data,
    };
  }).filter((row) => row.data.some((n) => n > 0));

  const has_data = series.length > 0 && series.some((row) => row.data.some((n) => n > 0));

  const body: WeeklyRiskTrendResponse = {
    weeks: weekKeys,
    week_labels: weekKeys.map(formatWeekShortLabel),
    series,
    has_data,
    weeks_requested: weeksRequested,
  };

  return NextResponse.json(body);
}

/** Понедельник ISO-недели (локальная TZ). */
function weekStartDate(weekKey: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  if (!match) return new Date();
  const year = Number(match[1]);
  const week = Number(match[2]);
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setDate(jan4.getDate() - day + 1);
  const start = new Date(mondayWeek1);
  start.setDate(mondayWeek1.getDate() + (week - 1) * 7);
  return start;
}
