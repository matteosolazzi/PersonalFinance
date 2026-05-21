"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { formatCurrency, getQuarterLabel } from "@/lib/utils";
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface DashboardData {
  invoices: {
    year: number;
    totalRevenue: number;
    totalTaxesOwed: number;
    totalAccrued: number;
    totalNet: number;
    delta: number;
    count: number;
  };
  netWorth: {
    latestPeriod: any;
    allPeriods: any[];
  };
}

function computeNetWorthTotals(period: any) {
  if (!period) return { realNW: 0, peValue: 0 };

  let realNW = 0;
  let peValue = 0;

  for (const v of period.values) {
    const item = v.assetItem;
    const val = item.isShares && v.shares && v.pricePerShare
      ? v.shares * v.pricePerShare
      : v.value;

    if (item.isPrivateEquity) {
      peValue += val;
    } else {
      realNW += val;
    }
  }
  return { realNW, peValue };
}

function getAllocationData(period: any, mode: "liquid" | "semiliquid" | "all") {
  if (!period) return [];

  const totals: Record<string, number> = {};

  for (const v of period.values) {
    const item = v.assetItem;
    if (item.isPrivateEquity && mode !== "all") continue;

    const catName = item.category.displayName;
    const val = item.isShares && v.shares && v.pricePerShare
      ? v.shares * v.pricePerShare
      : v.value;

    if (!item.isPrivateEquity) {
      const isPensionOrOther = ["Pensione", "Altro"].includes(catName);
      if (mode === "liquid" && isPensionOrOther) continue;
    }

    totals[catName] = (totals[catName] ?? 0) + val;
  }

  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: "" }));
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]).then(([dashData, invoicesData]) => {
      setData(dashData);
      setAllInvoices(invoicesData);
    });
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const { invoices, netWorth } = data;
  const { latestPeriod, allPeriods } = netWorth;
  const { realNW, peValue } = computeNetWorthTotals(latestPeriod);

  // Tax accrued from ALL years invoices (total accrued pending taxes)
  const totalAccruedAllYears = allInvoices.reduce((s: number, inv: any) => s + inv.amountAccrued, 0);

  // Net worth chart data
  const chartData = allPeriods.map((p: any) => {
    const { realNW: r, peValue: pe } = computeNetWorthTotals(p);
    return {
      label: getQuarterLabel(p.year, p.quarter),
      realNW: r,
      withPE: r + pe,
    };
  });

  // Revenue by year
  const revenueByYear: Record<number, { revenue: number; net: number }> = {};
  for (const inv of allInvoices) {
    if (!revenueByYear[inv.year]) revenueByYear[inv.year] = { revenue: 0, net: 0 };
    revenueByYear[inv.year].revenue += inv.amount;
    const taxRate = inv.client.type === "PIVA" ? 0.24 : 0;
    revenueByYear[inv.year].net += inv.amount * (1 - taxRate);
  }
  const revenueChartData = Object.entries(revenueByYear)
    .map(([year, vals]) => ({ year: parseInt(year), ...vals }))
    .sort((a, b) => a.year - b.year);

  // Allocation data
  const liquidAllocation = getAllocationData(latestPeriod, "liquid");
  const latestLabel = latestPeriod
    ? getQuarterLabel(latestPeriod.year, latestPeriod.quarter)
    : "—";

  // NW trend vs prev period
  let nwTrend: number | undefined;
  if (allPeriods.length >= 2) {
    const prev = allPeriods[allPeriods.length - 2];
    const { realNW: prevReal } = computeNetWorthTotals(prev);
    nwTrend = realNW - prevReal;
  }

  // Annual forecast
  const monthsElapsed = new Date().getMonth() + 1;
  const annualForecast = (invoices.totalRevenue / monthsElapsed) * 12;

  return (
    <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Aggiornato al {new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Tax accrual alert */}
      {totalAccruedAllYears > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-semibold text-sm">
              Tasse accantonate (XEON): {formatCurrency(totalAccruedAllYears)}
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Questi soldi sono accantonati per le tasse — non fanno parte del tuo patrimonio reale
            </p>
          </div>
        </div>
      )}

      {/* Net Worth Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Patrimonio reale"
          value={formatCurrency(realNW)}
          subValue={latestLabel}
          trend={nwTrend}
          accent="blue"
        />
        <StatCard
          label="+ Private Equity (Daze)"
          value={formatCurrency(realNW + peValue)}
          subValue={`di cui PE: ${formatCurrency(peValue)}`}
          accent="purple"
          note="Valore illiquido — stima quote"
        />
        <StatCard
          label={`Fatturato ${currentYear}`}
          value={formatCurrency(invoices.totalRevenue)}
          subValue={`Netto: ${formatCurrency(invoices.totalNet)}`}
          accent="green"
        />
      </div>

      {/* Invoice stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tasse stimate</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(invoices.totalTaxesOwed)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Accantonate</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(invoices.totalAccrued)}</p>
        </Card>
        <Card className={`p-4 ${invoices.delta >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Delta tasse</p>
          <div className="flex items-center gap-1.5">
            {invoices.delta >= 0
              ? <CheckCircle2 size={16} className="text-green-600" />
              : <AlertTriangle size={16} className="text-red-600" />}
            <p className={`text-xl font-bold ${invoices.delta >= 0 ? "text-green-700" : "text-red-700"}`}>
              {invoices.delta >= 0 ? "+" : ""}{formatCurrency(invoices.delta)}
            </p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Forecast annuo</p>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={16} className="text-blue-500" />
            <p className="text-xl font-bold text-slate-900">{formatCurrency(annualForecast, true)}</p>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            <Clock size={10} className="inline mr-0.5" />
            su {invoices.count} fatture
          </p>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Net Worth chart */}
        <Card>
          <CardHeader>
            <CardTitle>Andamento Net Worth</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <NetWorthChart data={chartData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fatturato per anno</CardTitle>
              <Badge variant="info">Anno corrente in corso</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {revenueChartData.length > 0 ? (
              <RevenueChart data={revenueChartData} currentYear={currentYear} />
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Nessun dato disponibile
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Allocation */}
      {latestPeriod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Allocazione (solo liquido) — {latestLabel}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AllocationChart data={liquidAllocation} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
