import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  className?: string;
  accent?: "blue" | "green" | "amber" | "red" | "purple";
  note?: string;
}

export function StatCard({ label, value, subValue, trend, className, accent = "blue", note }: StatCardProps) {
  const accents = {
    blue: "border-t-blue-500",
    green: "border-t-green-500",
    amber: "border-t-amber-500",
    red: "border-t-red-500",
    purple: "border-t-purple-500",
  };

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm border-t-2 p-5", accents[accent], className)}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {subValue && <p className="text-sm text-slate-500 mt-0.5">{subValue}</p>}
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-slate-400")}>
          {trend > 0 ? <TrendingUp size={12} /> : trend < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          {trend > 0 ? "+" : ""}{trend.toLocaleString("it-IT", { maximumFractionDigits: 0 })} € vs trim. prec.
        </div>
      )}
      {note && <p className="text-xs text-slate-400 mt-2 italic">{note}</p>}
    </div>
  );
}
