"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getQuarterLabel } from "@/lib/utils";
import { Plus, Save, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react";

interface AssetCategory {
  id: string;
  name: string;
  displayName: string;
  displayOrder: number;
  items: AssetItem[];
}

interface AssetItem {
  id: string;
  name: string;
  broker?: string;
  isPrivateEquity: boolean;
  isShares: boolean;
  categoryId: string;
  category: AssetCategory;
}

interface NetWorthValue {
  id: string;
  assetItemId: string;
  assetItem: AssetItem;
  value: number;
  shares?: number | null;
  pricePerShare?: number | null;
}

interface Period {
  id: string;
  year: number;
  quarter: number;
  values: NetWorthValue[];
}

function computeItemValue(v: NetWorthValue): number {
  if (v.assetItem.isShares && v.shares != null && v.pricePerShare != null) {
    return v.shares * v.pricePerShare;
  }
  return v.value;
}

function computePeriodTotal(period: Period, includePE = false): number {
  return period.values.reduce((sum, v) => {
    if (!includePE && v.assetItem.isPrivateEquity) return sum;
    return sum + computeItemValue(v);
  }, 0);
}

export function NetWorthContent() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, { value: number; shares?: number; pricePerShare?: number }>>({});
  const [saving, setSaving] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    const [periodsRes, catsRes] = await Promise.all([
      fetch("/api/net-worth-periods").then((r) => r.json()),
      fetch("/api/asset-categories").then((r) => r.json()),
    ]);
    setPeriods(periodsRes);
    setCategories(catsRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const latestPeriod = periods[periods.length - 1];
  const visiblePeriods = periods.slice(-8); // last 8 quarters for table

  const startEditing = (period: Period) => {
    const vals: Record<string, { value: number; shares?: number; pricePerShare?: number }> = {};
    for (const v of period.values) {
      vals[v.assetItemId] = {
        value: v.value,
        shares: v.shares ?? undefined,
        pricePerShare: v.pricePerShare ?? undefined,
      };
    }
    setEditValues(vals);
    setEditingPeriodId(period.id);
  };

  const saveEditing = async () => {
    if (!editingPeriodId) return;
    setSaving(true);

    const values = Object.entries(editValues).map(([assetItemId, v]) => ({
      assetItemId,
      value: v.value,
      shares: v.shares ?? null,
      pricePerShare: v.pricePerShare ?? null,
    }));

    await fetch(`/api/net-worth-periods/${editingPeriodId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });

    setSaving(false);
    setEditingPeriodId(null);
    setEditValues({});
    fetchData();
  };

  const createNewPeriod = async () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    const year = now.getFullYear();

    let newYear = year;
    let newQuarter = quarter;
    if (latestPeriod) {
      newQuarter = latestPeriod.quarter + 1;
      newYear = latestPeriod.year;
      if (newQuarter > 4) { newQuarter = 1; newYear++; }
    }

    await fetch("/api/net-worth-periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: newYear, quarter: newQuarter }),
    });
    await fetchData();
    const updated = await fetch("/api/net-worth-periods").then(r => r.json());
    const newPeriod = updated[updated.length - 1];
    if (newPeriod) startEditing(newPeriod);
  };

  const toggleCat = (catId: string) => {
    setCollapsedCats(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Build rows: categories + items
  const allItems = categories.flatMap((c) => c.items.map((i) => ({ ...i, category: c })));

  return (
    <div className="px-4 py-6 md:px-8 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Net Worth</h1>
          <p className="text-slate-500 text-sm mt-1">Aggiornamento trimestrale del patrimonio</p>
        </div>
        <div className="flex gap-2">
          {editingPeriodId ? (
            <>
              <Button variant="outline" onClick={() => { setEditingPeriodId(null); setEditValues({}); }}>
                Annulla
              </Button>
              <Button onClick={saveEditing} disabled={saving}>
                <Save size={16} />
                {saving ? "Salvataggio..." : "Salva trimestre"}
              </Button>
            </>
          ) : (
            <Button onClick={createNewPeriod}>
              <Plus size={16} />
              Nuovo trimestre
            </Button>
          )}
        </div>
      </div>

      {editingPeriodId && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-700">
          <Unlock size={15} />
          Modalità modifica attiva — modifica i valori nella colonna evidenziata, poi salva
        </div>
      )}

      {/* Spreadsheet table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50 min-w-[180px] z-10">
                  Asset
                </th>
                {visiblePeriods.map((p) => (
                  <th
                    key={p.id}
                    className={`px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide min-w-[110px] ${
                      p.id === editingPeriodId
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500"
                    }`}
                  >
                    {getQuarterLabel(p.year, p.quarter)}
                    {p.id === editingPeriodId && (
                      <span className="block text-xs font-normal normal-case mt-0.5 text-blue-400">✏️ modifica</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => {
                const catItems = allItems.filter((i) => i.categoryId === cat.id);
                const isCollapsed = collapsedCats.has(cat.id);

                return (
                  <>
                    {/* Category header row */}
                    <tr
                      key={`cat-${cat.id}`}
                      className="bg-slate-800 cursor-pointer"
                      onClick={() => toggleCat(cat.id)}
                    >
                      <td className="px-4 py-2 sticky left-0 bg-slate-800 z-10">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
                          <span className="text-xs font-bold text-white uppercase tracking-wider">{cat.displayName}</span>
                        </div>
                      </td>
                      {visiblePeriods.map((p) => {
                        const catTotal = catItems.reduce((sum, item) => {
                          const v = p.values.find((val) => val.assetItemId === item.id);
                          if (!v) return sum;
                          if (p.id === editingPeriodId && editValues[item.id]) {
                            const ev = editValues[item.id];
                            return sum + (item.isShares && ev.shares && ev.pricePerShare ? ev.shares * ev.pricePerShare : ev.value);
                          }
                          return sum + computeItemValue(v);
                        }, 0);
                        return (
                          <td key={p.id} className={`px-3 py-2 text-right text-xs font-bold text-white ${p.id === editingPeriodId ? "bg-blue-900/40" : ""}`}>
                            {formatCurrency(catTotal)}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Item rows */}
                    {!isCollapsed && catItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                          <div className="pl-4">
                            <span className="text-slate-700 font-medium">{item.name}</span>
                            {item.broker && <span className="text-slate-400 text-xs ml-1.5">({item.broker})</span>}
                            {item.isPrivateEquity && <Badge variant="info" className="ml-1.5">PE</Badge>}
                          </div>
                        </td>
                        {visiblePeriods.map((p) => {
                          const v = p.values.find((val) => val.assetItemId === item.id);
                          const isEditing = p.id === editingPeriodId;
                          const ev = editValues[item.id];

                          if (isEditing) {
                            return (
                              <td key={p.id} className="px-2 py-1.5 bg-blue-50">
                                {item.isShares ? (
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="Quote"
                                      value={ev?.shares ?? ""}
                                      onChange={(e) => setEditValues((prev) => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], shares: parseFloat(e.target.value) || 0 },
                                      }))}
                                      className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                    <input
                                      type="number"
                                      step="0.01"
                                      placeholder="€/quota"
                                      value={ev?.pricePerShare ?? ""}
                                      onChange={(e) => setEditValues((prev) => ({
                                        ...prev,
                                        [item.id]: { ...prev[item.id], pricePerShare: parseFloat(e.target.value) || 0 },
                                      }))}
                                      className="w-full border border-blue-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                    {ev?.shares && ev?.pricePerShare && (
                                      <p className="text-xs text-blue-600 text-right font-medium">
                                        = {formatCurrency(ev.shares * ev.pricePerShare)}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={ev?.value ?? 0}
                                    onChange={(e) => setEditValues((prev) => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], value: parseFloat(e.target.value) || 0 },
                                    }))}
                                    className="w-full border border-blue-200 rounded px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                                  />
                                )}
                              </td>
                            );
                          }

                          const displayVal = v ? computeItemValue(v) : 0;
                          return (
                            <td key={p.id} className="px-3 py-2.5 text-right text-slate-600">
                              {displayVal > 0 ? formatCurrency(displayVal) : <span className="text-slate-200">—</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                );
              })}

              {/* Total row */}
              <tr className="bg-slate-900 border-t-2 border-slate-700">
                <td className="px-4 py-3 sticky left-0 bg-slate-900 z-10 text-white font-bold text-sm uppercase tracking-wide">
                  Totale reale
                </td>
                {visiblePeriods.map((p) => {
                  const total = p.id === editingPeriodId
                    ? allItems.reduce((sum, item) => {
                        if (item.isPrivateEquity) return sum;
                        const ev = editValues[item.id];
                        if (!ev) {
                          const v = p.values.find((val) => val.assetItemId === item.id);
                          return sum + (v ? computeItemValue(v) : 0);
                        }
                        return sum + (item.isShares && ev.shares && ev.pricePerShare ? ev.shares * ev.pricePerShare : ev.value);
                      }, 0)
                    : computePeriodTotal(p, false);

                  const prev = periods[periods.indexOf(p) - 1];
                  const prevTotal = prev ? computePeriodTotal(prev, false) : null;
                  const diff = prevTotal !== null ? total - prevTotal : null;

                  return (
                    <td key={p.id} className={`px-3 py-3 text-right ${p.id === editingPeriodId ? "bg-blue-900/40" : ""}`}>
                      <div>
                        <p className="text-white font-bold text-sm">{formatCurrency(total)}</p>
                        {diff !== null && (
                          <p className={`text-xs ${diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
                          </p>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Total + PE row */}
              <tr className="bg-slate-800">
                <td className="px-4 py-2.5 sticky left-0 bg-slate-800 z-10 text-slate-300 font-medium text-xs uppercase tracking-wide">
                  Tot. + Daze (PE)
                </td>
                {visiblePeriods.map((p) => {
                  const total = computePeriodTotal(p, true);
                  return (
                    <td key={p.id} className={`px-3 py-2.5 text-right text-slate-300 text-xs font-medium ${p.id === editingPeriodId ? "bg-blue-900/30" : ""}`}>
                      {formatCurrency(total)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Admin link */}
      <div className="mt-6 text-center">
        <a href="/settings/admin" className="text-xs text-slate-300 hover:text-slate-500 transition-colors">
          <Lock size={10} className="inline mr-1" />
          Admin: modifica dati storici
        </a>
      </div>
    </div>
  );
}
