"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { formatCurrency, formatPercent, getQuarterLabel } from "@/lib/utils";

interface Period {
  id: string;
  year: number;
  quarter: number;
  values: Array<{
    assetItemId: string;
    value: number;
    shares?: number | null;
    pricePerShare?: number | null;
    assetItem: {
      name: string;
      isPrivateEquity: boolean;
      isShares: boolean;
      geoAllocUs?: number | null;
      geoAllocDevExUs?: number | null;
      geoAllocEm?: number | null;
      category: { displayName: string; name: string };
    };
  }>;
}

function computeItemValue(v: { value: number; shares?: number | null; pricePerShare?: number | null; assetItem: { isShares: boolean } }): number {
  if (v.assetItem.isShares && v.shares != null && v.pricePerShare != null) {
    return v.shares * v.pricePerShare;
  }
  return v.value;
}

function buildAllocation(period: Period, mode: "liquid" | "semiliquid" | "all") {
  const totals: Record<string, number> = {};
  for (const v of period.values) {
    const item = v.assetItem;
    const val = computeItemValue(v);
    if (val === 0) continue;

    const catName = item.category.displayName;
    const isPensionOrOther = ["Pensione", "Altro"].includes(catName);
    const isPrivate = item.isPrivateEquity;

    if (isPrivate && mode !== "all") continue;
    if (isPensionOrOther && mode === "liquid") continue;

    totals[catName] = (totals[catName] ?? 0) + val;
  }

  const total = Object.values(totals).reduce((s, v) => s + v, 0);
  return Object.entries(totals)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, color: "", pct: total > 0 ? value / total : 0 }));
}

function buildGeoBreakdown(period: Period) {
  let us = 0, devExUs = 0, em = 0;
  let total = 0;

  for (const v of period.values) {
    const item = v.assetItem;
    if (item.isPrivateEquity) continue;
    const catName = item.category.name;
    if (catName !== "equity") continue;

    const val = computeItemValue(v);
    if (val === 0) continue;
    if (item.geoAllocUs == null) continue; // only items with geo data

    us += val * (item.geoAllocUs ?? 0);
    devExUs += val * (item.geoAllocDevExUs ?? 0);
    em += val * (item.geoAllocEm ?? 0);
    total += val;
  }

  if (total === 0) return null;
  return {
    us: us / total,
    devExUs: devExUs / total,
    em: em / total,
    totalEquity: total,
  };
}

const COLORS: Record<string, string> = {
  Liquidità: "#2563eb",
  Equity: "#16a34a",
  Bonds: "#d97706",
  Crypto: "#7c3aed",
  Commodities: "#dc2626",
  Pensione: "#0891b2",
  Altro: "#64748b",
  "Private Equity": "#9333ea",
};

const GEO_COLORS = ["#2563eb", "#16a34a", "#d97706"];

export function AllocationContent() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/net-worth-periods")
      .then((r) => r.json())
      .then((data) => { setPeriods(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const latestPeriod = periods[periods.length - 1];

  if (!latestPeriod) {
    return (
      <div className="px-4 py-6 md:px-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Allocazione</h1>
        <p className="text-slate-500">Nessun dato disponibile. Inserisci prima i dati del Net Worth.</p>
      </div>
    );
  }

  const label = getQuarterLabel(latestPeriod.year, latestPeriod.quarter);
  const liquidAlloc = buildAllocation(latestPeriod, "liquid");
  const semiAlloc = buildAllocation(latestPeriod, "semiliquid");
  const allAlloc = buildAllocation(latestPeriod, "all");
  const geo = buildGeoBreakdown(latestPeriod);

  const allTotal = allAlloc.reduce((s, d) => s + d.value, 0);

  return (
    <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Allocazione</h1>
        <p className="text-slate-500 text-sm mt-1">Dati al {label}</p>
      </div>

      {/* Three allocation views */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Liquid only */}
        <Card>
          <CardHeader>
            <CardTitle>Solo liquido</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Esclude Pensione, Altro, PE</p>
          </CardHeader>
          <CardContent>
            <AllocationChart data={liquidAlloc} showLegend={false} />
            <div className="mt-3 space-y-2">
              {liquidAlloc.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[d.name] ?? "#94a3b8" }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">{formatPercent(d.pct)}</span>
                    <span className="text-slate-400 ml-1.5">{formatCurrency(d.value, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Semi-liquid (+ Pension + Other) */}
        <Card>
          <CardHeader>
            <CardTitle>Con semi-liquido</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Include Pensione e Altro</p>
          </CardHeader>
          <CardContent>
            <AllocationChart data={semiAlloc} showLegend={false} />
            <div className="mt-3 space-y-2">
              {semiAlloc.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[d.name] ?? "#94a3b8" }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">{formatPercent(d.pct)}</span>
                    <span className="text-slate-400 ml-1.5">{formatCurrency(d.value, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All including PE */}
        <Card>
          <CardHeader>
            <CardTitle>Con Private Equity</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Include Daze (illiquido)</p>
          </CardHeader>
          <CardContent>
            <AllocationChart data={allAlloc} showLegend={false} />
            <div className="mt-3 space-y-2">
              {allAlloc.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[d.name] ?? "#94a3b8" }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800">{formatPercent(d.pct)}</span>
                    <span className="text-slate-400 ml-1.5">{formatCurrency(d.value, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Equity Breakdown */}
      {geo && (
        <Card>
          <CardHeader>
            <CardTitle>Breakdown geografico Equity</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Solo ETF/Equity con allocazione geografica definita — Totale: {formatCurrency(geo.totalEquity)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "US", value: geo.us, color: GEO_COLORS[0] },
                { label: "Dev ex-US", value: geo.devExUs, color: GEO_COLORS[1] },
                { label: "Emerging Markets", value: geo.em, color: GEO_COLORS[2] },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-3xl font-bold mb-1" style={{ color: item.color }}>
                    {formatPercent(item.value)}
                  </div>
                  <div className="text-sm text-slate-500">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{formatCurrency(geo.totalEquity * item.value, true)}</div>
                  {/* Bar */}
                  <div className="mt-2 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${item.value * 100}%`, background: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total summary */}
      <div className="mt-6 bg-slate-900 rounded-xl p-5 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Totale reale</p>
            <p className="text-xl font-bold">{formatCurrency(liquidAlloc.reduce((s,d)=>s+d.value,0))}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Con semi-liquido</p>
            <p className="text-xl font-bold">{formatCurrency(semiAlloc.reduce((s,d)=>s+d.value,0))}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Con Private Equity</p>
            <p className="text-xl font-bold">{formatCurrency(allTotal)}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Private Equity</p>
            <p className="text-xl font-bold text-purple-400">
              {formatCurrency(allAlloc.find(d => d.name === "Private Equity")?.value ?? 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
