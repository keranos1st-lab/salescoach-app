"use client";

import type { WeeklyRiskTrendResponse } from "@/app/api/risks/weekly-trend/route";
import { riskChartColor } from "@/lib/report-risks";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function RiskTrendSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-56 rounded bg-zinc-800" />
      <div className="h-[280px] rounded-2xl bg-zinc-800/60" />
    </div>
  );
}

type ChartRow = Record<string, string | number>;

export function RiskTrendChart() {
  const [data, setData] = useState<WeeklyRiskTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/risks/weekly-trend?weeks=8");
      const json = (await res.json()) as WeeklyRiskTrendResponse & { error?: string };
      if (!res.ok) {
        setError(json.error || "Не удалось загрузить тренд рисков");
        setData(null);
        return;
      }
      setData(json);
    } catch {
      setError("Ошибка сети");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const chartData = useMemo((): ChartRow[] => {
    if (!data?.weeks.length) return [];
    return data.weeks.map((weekKey, index) => {
      const row: ChartRow = {
        weekKey,
        weekLabel: data.week_labels[index] ?? weekKey,
      };
      for (const series of data.series) {
        row[series.risk_id] = series.data[index] ?? 0;
      }
      return row;
    });
  }, [data]);

  const yMax = useMemo(() => {
    if (!data?.series.length) return 4;
    let max = 0;
    for (const series of data.series) {
      for (const n of series.data) {
        if (n > max) max = n;
      }
    }
    return Math.max(4, max + 1);
  }, [data]);

  return (
    <section className="no-print mt-10">
      <h2 className="text-lg font-semibold text-zinc-100">Динамика рисков по неделям</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Количество звонков с каждым типом риска
      </p>

      <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        {loading ? (
          <RiskTrendSkeleton />
        ) : error ? (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : !data?.has_data || data.series.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center text-sm text-zinc-500">
            Недостаточно данных для отображения тренда
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, yMax]}
                  allowDecimals={false}
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#09090b",
                    borderColor: "#27272a",
                    borderRadius: 12,
                  }}
                  labelStyle={{ color: "#e4e4e7" }}
                  formatter={(value, _name, item) => {
                    const riskId = String(item.dataKey ?? "");
                    const series = data.series.find((s) => s.risk_id === riskId);
                    const label = series?.label ?? riskId;
                    return [`${value} звонков`, label];
                  }}
                  labelFormatter={(label) => String(label)}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 12 }}
                  formatter={(value) => {
                    const series = data.series.find((s) => s.risk_id === value);
                    return series?.label ?? value;
                  }}
                />
                {data.series.map((series, index) => (
                  <Line
                    key={series.risk_id}
                    type="monotone"
                    dataKey={series.risk_id}
                    name={series.risk_id}
                    stroke={riskChartColor(series.risk_id, index)}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
