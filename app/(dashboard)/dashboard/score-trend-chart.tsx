"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScoreTrendPoint = {
  date: string;
  avgScore: number;
};

export function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-zinc-500">
        Недостаточно данных для графика
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            tickFormatter={(value: string) =>
              new Date(value).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
              })
            }
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#09090b",
              borderColor: "#27272a",
              borderRadius: 12,
            }}
            labelStyle={{ color: "#e4e4e7" }}
            formatter={(value) => [`${value}`, "Средний балл"]}
          />
          <Line
            type="monotone"
            dataKey="avgScore"
            stroke="#14b8a6"
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
