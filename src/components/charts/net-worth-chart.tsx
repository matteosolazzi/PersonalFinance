"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartDataPoint {
  label: string;
  realNW: number;
  withPE: number;
}

interface NetWorthChartProps {
  data: ChartDataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-slate-300 text-xs font-medium mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-400 text-xs">{entry.name}:</span>
          <span className="text-white font-semibold text-xs">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function NetWorthChart({ data }: NetWorthChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="gradientReal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientPE" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v, true)}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
          iconType="circle"
          iconSize={8}
        />
        {/* PE area first (behind) */}
        <Area
          type="monotone"
          dataKey="withPE"
          name="+ Daze (PE)"
          stroke="#7c3aed"
          strokeWidth={1.5}
          strokeDasharray="4 2"
          fill="url(#gradientPE)"
          dot={false}
          activeDot={{ r: 4, fill: "#7c3aed" }}
        />
        {/* Real NW on top */}
        <Area
          type="monotone"
          dataKey="realNW"
          name="Patrimonio reale"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#gradientReal)"
          dot={false}
          activeDot={{ r: 5, fill: "#2563eb" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
