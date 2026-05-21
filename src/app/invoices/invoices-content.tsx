"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, CheckCircle2, AlertTriangle, TrendingUp, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  type: "PIVA" | "OCCASIONAL";
}

interface Invoice {
  id: string;
  year: number;
  invoiceNumber: string;
  date: string;
  clientId: string;
  client: Client;
  amount: number;
  amountAccrued: number;
  notes?: string;
}

interface TaxRate {
  id: string;
  year: number;
  rate: number;
}

function getTaxRate(year: number, rates: TaxRate[]): number {
  return rates.find((r) => r.year === year)?.rate ?? 0.24;
}

function InvoiceForm({
  invoice,
  clients,
  onSave,
  onCancel,
}: {
  invoice?: Invoice;
  clients: Client[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    year: invoice?.year ?? new Date().getFullYear(),
    invoiceNumber: invoice?.invoiceNumber ?? "",
    date: invoice?.date ? invoice.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
    clientId: invoice?.clientId ?? (clients[0]?.id ?? ""),
    amount: invoice?.amount ?? 0,
    amountAccrued: invoice?.amountAccrued ?? 0,
    notes: invoice?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {invoice ? "Modifica fattura" : "Nuova fattura"}
          </h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Anno</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">N. Fattura</label>
              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                placeholder="1, 2, -, ..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Cliente</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.type === "OCCASIONAL" ? "(occasionale)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Importo €</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Accantonate €</label>
              <input
                type="number"
                step="0.01"
                value={form.amountAccrued}
                onChange={(e) => setForm({ ...form, amountAccrued: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Note</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Annulla
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Salvataggio..." : invoice ? "Aggiorna" : "Crea fattura"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InvoicesContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | undefined>();
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [invRes, clientsRes, ratesRes] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/tax-rates").then((r) => r.json()),
    ]);
    setInvoices(invRes);
    setClients(clientsRes);
    setTaxRates(ratesRes);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const years = [...new Set(invoices.map((i) => i.year))].sort((a, b) => b - a);
  const yearInvoices = invoices.filter((i) => i.year === selectedYear);
  const taxRate = getTaxRate(selectedYear, taxRates);

  // Compute running delta
  let cumulativeAccrued = 0;
  let cumulativeTaxes = 0;
  const enriched = yearInvoices.map((inv) => {
    const taxes = inv.client.type === "PIVA" ? inv.amount * taxRate : 0;
    const net = inv.amount - taxes;
    cumulativeAccrued += inv.amountAccrued;
    cumulativeTaxes += taxes;
    return { ...inv, taxes, net, delta: cumulativeAccrued - cumulativeTaxes };
  });

  const totals = enriched.reduce(
    (acc, inv) => ({
      revenue: acc.revenue + inv.amount,
      taxes: acc.taxes + inv.taxes,
      accrued: acc.accrued + inv.amountAccrued,
      net: acc.net + inv.net,
    }),
    { revenue: 0, taxes: 0, accrued: 0, net: 0 }
  );
  const finalDelta = totals.accrued - totals.taxes;

  const handleSave = async (formData: any) => {
    if (editInvoice) {
      await fetch(`/api/invoices/${editInvoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    }
    setShowForm(false);
    setEditInvoice(undefined);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminare questa fattura?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fatture</h1>
          <p className="text-slate-500 text-sm mt-1">Gestione fatturazione e accantonamento tasse</p>
        </div>
        <Button onClick={() => { setEditInvoice(undefined); setShowForm(true); }}>
          <Plus size={16} />
          Nuova fattura
        </Button>
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedYear === y
                ? "bg-blue-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="p-4 border-t-2 border-t-blue-500">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Fatturato</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.revenue)}</p>
        </Card>
        <Card className="p-4 border-t-2 border-t-green-500">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Netto</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totals.net)}</p>
          <p className="text-xs text-slate-400">/{Math.round(totals.net / 12).toLocaleString("it-IT")} /mese</p>
        </Card>
        <Card className="p-4 border-t-2 border-t-amber-500">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tasse stimate ({(taxRate * 100).toFixed(0)}%)</p>
          <p className="text-xl font-bold text-amber-700">{formatCurrency(totals.taxes)}</p>
        </Card>
        <Card className="p-4 border-t-2 border-t-slate-500">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Accantonate</p>
          <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.accrued)}</p>
        </Card>
        <Card className={`p-4 border-t-2 ${finalDelta >= 0 ? "border-t-green-500 bg-green-50" : "border-t-red-500 bg-red-50"}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Delta</p>
          <div className="flex items-center gap-1.5">
            {finalDelta >= 0
              ? <CheckCircle2 size={16} className="text-green-600" />
              : <AlertTriangle size={16} className="text-red-600" />}
            <p className={`text-xl font-bold ${finalDelta >= 0 ? "text-green-700" : "text-red-700"}`}>
              {finalDelta >= 0 ? "+" : ""}{formatCurrency(finalDelta)}
            </p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{yearInvoices.length} fatture — {selectedYear}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">N.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Importo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Tasse</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Netto</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Accantonato</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Delta cum.</th>
                <th className="px-4 py-3 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {enriched.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    Nessuna fattura per il {selectedYear}
                  </td>
                </tr>
              ) : (
                enriched.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{inv.client.name}</span>
                        {inv.client.type === "OCCASIONAL" && (
                          <Badge variant="info">Occ.</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-right text-amber-600">
                      {inv.taxes > 0 ? formatCurrency(inv.taxes) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-green-700 font-medium">{formatCurrency(inv.net)}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {inv.amountAccrued > 0 ? formatCurrency(inv.amountAccrued) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${inv.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {inv.delta >= 0 ? "+" : ""}{formatCurrency(inv.delta)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => { setEditInvoice(inv); setShowForm(true); }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form modal */}
      {showForm && (
        <InvoiceForm
          invoice={editInvoice}
          clients={clients}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditInvoice(undefined); }}
        />
      )}
    </div>
  );
}
