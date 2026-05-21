"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, getQuarterLabel } from "@/lib/utils";
import { Save, Lock, Trash2 } from "lucide-react";

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
      isShares: boolean;
      isPrivateEquity: boolean;
      broker?: string;
      category: { displayName: string };
    };
  }>;
}

export function AdminContent() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const data = await fetch("/api/net-worth-periods").then((r) => r.json());
    setPeriods(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const startEdit = (period: Period) => {
    const vals: Record<string, any> = {};
    for (const v of period.values) {
      vals[v.assetItemId] = { value: v.value, shares: v.shares, pricePerShare: v.pricePerShare };
    }
    setEditValues(vals);
    setSelectedPeriodId(period.id);
  };

  const saveEdit = async () => {
    if (!selectedPeriodId) return;
    setSaving(true);
    const values = Object.entries(editValues).map(([assetItemId, v]) => ({
      assetItemId,
      value: v.value,
      shares: v.shares ?? null,
      pricePerShare: v.pricePerShare ?? null,
    }));
    await fetch(`/api/net-worth-periods/${selectedPeriodId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    setSaving(false);
    setSelectedPeriodId(null);
    fetchData();
  };

  const deletePeriod = async (id: string) => {
    if (!confirm("Eliminare questo trimestre? L'operazione non può essere annullata.")) return;
    await fetch(`/api/net-worth-periods/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>;
  }

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Lock size={16} className="text-slate-400" />
        <h1 className="text-2xl font-bold text-slate-900">Admin — Storico Net Worth</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">
        Modifica o elimina i dati storici dei trimestri passati. Usare con cautela.
      </p>

      {/* Period list */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => startEdit(p)}
            className={`rounded-xl p-3 text-left border transition-colors ${
              selectedPeriodId === p.id
                ? "bg-blue-600 border-blue-600 text-white"
                : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
            }`}
          >
            <p className="font-semibold text-sm">{getQuarterLabel(p.year, p.quarter)}</p>
          </button>
        ))}
      </div>

      {/* Edit form */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Modifica {getQuarterLabel(selectedPeriod.year, selectedPeriod.quarter)}</CardTitle>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => deletePeriod(selectedPeriod.id)}>
                  <Trash2 size={14} />
                  Elimina
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={saving}>
                  <Save size={14} />
                  {saving ? "..." : "Salva"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedPeriod.values.map((v) => {
                const ev = editValues[v.assetItemId] ?? {};
                return (
                  <div key={v.assetItemId} className="flex items-center gap-3">
                    <div className="w-48 flex-shrink-0">
                      <p className="text-sm font-medium text-slate-700">{v.assetItem.name}</p>
                      <p className="text-xs text-slate-400">{v.assetItem.category.displayName}</p>
                    </div>
                    {v.assetItem.isShares ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Quote"
                          value={ev.shares ?? ""}
                          onChange={(e) => setEditValues((prev) => ({
                            ...prev,
                            [v.assetItemId]: { ...prev[v.assetItemId], shares: parseFloat(e.target.value) || 0 },
                          }))}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="€/quota"
                          value={ev.pricePerShare ?? ""}
                          onChange={(e) => setEditValues((prev) => ({
                            ...prev,
                            [v.assetItemId]: { ...prev[v.assetItemId], pricePerShare: parseFloat(e.target.value) || 0 },
                          }))}
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {ev.shares && ev.pricePerShare && (
                          <span className="text-sm text-slate-500 self-center w-24 text-right">
                            = {formatCurrency(ev.shares * ev.pricePerShare)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="number"
                        step="0.01"
                        value={ev.value ?? 0}
                        onChange={(e) => setEditValues((prev) => ({
                          ...prev,
                          [v.assetItemId]: { ...prev[v.assetItemId], value: parseFloat(e.target.value) || 0 },
                        }))}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
