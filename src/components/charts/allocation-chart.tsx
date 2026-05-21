"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency, formatPercent } from "@/lib/utils";

interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Liquidità: "#2563eb",
  Equity: "#16a34a",
  Bonds: "#d97706",
  Crypto: "#7c3aed",
  Commodities: "#dc2626",
  Pensione: "#0891b2",
  Altro: "#64748b",
  "Private Equity": "#9333ea",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
      <p className="text-white text-sm font-semibold">{d.name}</p>
      <p className="text-slate-300 text-xs mt-1">{formatCurrency(d.value)}</p>
      <p className="text-slate-400 text-xs">{formatPercent(d.value / d.total)}</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

interface AllocationChartProps {
  data: AllocationItem[];
  showLegend?: boolean;
}

export function AllocationChart({ data, showLegend = true }: AllocationChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.filter(d => d.value > 0).map(d => ({ ...d, total, color: CATEGORY_COLORS[d.name] ?? "#94a3b8" }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={enriched}
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
        >
          {enriched.map((entry, index) => (
            <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", color: "#64748b" }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
