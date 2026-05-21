"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface RevenueDataPoint {
  year: number;
  revenue: number;
  net: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-xs font-medium mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.fill }} />
          <span className="text-slate-400 text-xs">{entry.name}:</span>
          <span className="text-white font-semibold text-xs">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currentYear: number;
}

export function RevenueChart({ data, currentYear }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, true)}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="revenue" name="Fatturato" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry) => (
            <Cell
              key={entry.year}
              fill={entry.year === currentYear ? "#93c5fd" : "#2563eb"}
              opacity={entry.year === currentYear ? 0.6 : 1}
            />
          ))}
        </Bar>
        <Bar dataKey="net" name="Netto" radius={[4, 4, 0, 0]} fill="#16a34a" maxBarSize={40}>
          {data.map((entry) => (
            <Cell
              key={entry.year}
              fill={entry.year === currentYear ? "#86efac" : "#16a34a"}
              opacity={entry.year === currentYear ? 0.6 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
