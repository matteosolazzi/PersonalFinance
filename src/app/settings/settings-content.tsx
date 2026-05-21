"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: "PIVA" | "OCCASIONAL";
  isActive: boolean;
}

interface TaxRate {
  id: string;
  year: number;
  rate: number;
}

export function SettingsContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [newClient, setNewClient] = useState({ name: "", type: "PIVA" as "PIVA" | "OCCASIONAL" });
  const [newRate, setNewRate] = useState({ year: new Date().getFullYear(), rate: 24 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    const [c, r] = await Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/tax-rates").then((r) => r.json()),
    ]);
    setClients(c);
    setTaxRates(r);
  };

  useEffect(() => { fetchData(); }, []);

  const addClient = async () => {
    if (!newClient.name.trim()) return;
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient),
    });
    setNewClient({ name: "", type: "PIVA" });
    fetchData();
  };

  const saveRate = async () => {
    setSaving(true);
    await fetch("/api/tax-rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: newRate.year, rate: newRate.rate / 100 }),
    });
    setMsg("Aliquota salvata!");
    setTimeout(() => setMsg(""), 3000);
    setSaving(false);
    fetchData();
  };

  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Impostazioni</h1>
        <p className="text-slate-500 text-sm mt-1">Gestisci clienti, aliquote e configurazioni</p>
      </div>

      {/* Clients */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clienti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {clients.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-800">{c.name}</span>
                  <Badge variant={c.type === "PIVA" ? "default" : "info"}>
                    {c.type === "PIVA" ? "P.IVA" : "Occasionale"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {/* Add client */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              placeholder="Nome cliente"
              value={newClient.name}
              onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newClient.type}
              onChange={(e) => setNewClient({ ...newClient, type: e.target.value as "PIVA" | "OCCASIONAL" })}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PIVA">P.IVA</option>
              <option value="OCCASIONAL">Occasionale</option>
            </select>
            <Button onClick={addClient}>
              <Plus size={16} />
              Aggiungi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tax rates */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Aliquote tasse per anno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {taxRates.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                <span className="font-medium text-slate-800">{r.year}</span>
                <Badge variant="warning">{(r.rate * 100).toFixed(1)}%</Badge>
              </div>
            ))}
            {taxRates.length === 0 && (
              <p className="text-slate-400 text-sm">Nessuna aliquota configurata — verrà usata quella di default (24%)</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <input
              type="number"
              placeholder="Anno"
              value={newRate.year}
              onChange={(e) => setNewRate({ ...newRate, year: parseInt(e.target.value) })}
              className="w-28 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden flex-1">
              <input
                type="number"
                step="0.1"
                min={0}
                max={100}
                value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: parseFloat(e.target.value) })}
                className="flex-1 px-3 py-2 text-sm focus:outline-none"
              />
              <span className="px-3 text-slate-400 text-sm bg-slate-50 h-full flex items-center border-l">%</span>
            </div>
            <Button onClick={saveRate} disabled={saving}>
              <Save size={16} />
              Salva
            </Button>
          </div>
          {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
