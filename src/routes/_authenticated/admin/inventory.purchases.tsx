import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { formatINR } from "@/lib/format";
import { logActivity } from "@/lib/log";

type Row = {
  id: string;
  purchase_date: string;
  product: string;
  supplier: string;
  quantity: number;
  unit_cost: number;
  total: number;
};

export const Route = createFileRoute("/_authenticated/admin/inventory/purchases")({
  component: Purchases,
});

function Purchases() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const [entries, prods, sups] = await Promise.all([
        supabase.from("purchase_entries").select("*").order("purchase_date", { ascending: false }),
        supabase.from("products").select("id, name"),
        supabase.from("suppliers").select("id, name"),
      ]);
      const pn = new Map((prods.data ?? []).map((p) => [p.id, p.name]));
      const sn = new Map((sups.data ?? []).map((s) => [s.id, s.name]));
      const rows: Row[] = (entries.data ?? []).map((e) => ({
        id: e.id,
        purchase_date: e.purchase_date,
        product: pn.get(e.product_id) ?? "—",
        supplier: e.supplier_id ? (sn.get(e.supplier_id) ?? "—") : "—",
        quantity: e.quantity,
        unit_cost: Number(e.unit_cost ?? 0),
        total: e.quantity * Number(e.unit_cost ?? 0),
      }));
      return { rows, products: prods.data ?? [], suppliers: sups.data ?? [] };
    },
  });

  const [form, setForm] = useState<{
    product_id: string;
    supplier_id: string;
    quantity: number;
    unit_cost: number;
    purchase_date: string;
    notes: string;
  }>({
    product_id: "",
    supplier_id: "",
    quantity: 1,
    unit_cost: 0,
    purchase_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const save = async () => {
    if (!form.product_id || form.quantity <= 0) return toast.error("Choose product and quantity.");
    const { error, data: inserted } = await supabase.from("purchase_entries").insert({
      product_id: form.product_id,
      supplier_id: form.supplier_id || null,
      quantity: form.quantity,
      unit_cost: form.unit_cost,
      purchase_date: form.purchase_date,
      notes: form.notes || null,
    }).select().single();
    if (error) return toast.error(error.message);
    await logActivity("purchase.create", "purchase_entries", inserted?.id);
    toast.success("Purchase recorded — stock updated");
    setForm({ ...form, product_id: "", quantity: 1, unit_cost: 0, notes: "" });
    qc.invalidateQueries({ queryKey: ["purchases"] });
    qc.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    qc.invalidateQueries({ queryKey: ["inventory-stock-list"] });
    qc.invalidateQueries({ queryKey: ["inventory-history"] });
  };

  const columns: Column<Row>[] = [
    { key: "purchase_date", header: "Date" },
    { key: "product", header: "Product" },
    { key: "supplier", header: "Supplier" },
    { key: "quantity", header: "Qty" },
    { key: "unit_cost", header: "Unit cost", render: (r) => formatINR(r.unit_cost) },
    { key: "total", header: "Total", render: (r) => formatINR(r.total) },
  ];

  return (
    <div>
      <AdminPageHeader title="Purchase entries" subtitle="Log inventory purchases — stock is added automatically." />
      <div className="mb-6 rounded-2xl border bg-background p-5 shadow-soft">
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="rounded-full border bg-background px-3 py-2 text-sm">
            <option value="">Product…</option>
            {data?.products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="rounded-full border bg-background px-3 py-2 text-sm">
            <option value="">Supplier (opt)…</option>
            {data?.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} placeholder="Qty" className="rounded-full border bg-background px-3 py-2 text-sm" />
          <input type="number" min={0} step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: Number(e.target.value) })} placeholder="Unit cost" className="rounded-full border bg-background px-3 py-2 text-sm" />
          <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="rounded-full border bg-background px-3 py-2 text-sm" />
          <button onClick={save} className="rounded-full bg-rose-gradient px-4 py-2 text-xs text-primary-foreground shadow-luxe">Record purchase</button>
        </div>
        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" className="mt-3 w-full rounded-full border bg-background px-3 py-2 text-sm" />
      </div>
      <DataTable rows={data?.rows ?? []} columns={columns} exportName="purchases" />
    </div>
  );
}
