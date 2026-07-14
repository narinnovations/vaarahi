import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { logActivity } from "@/lib/log";

export const Route = createFileRoute("/_authenticated/admin/inventory/adjust")({
  component: AdjustStock,
});

type Adj = { product_id: string; delta: number };

function AdjustStock() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["adjust-products"],
    queryFn: async () => (await supabase.from("products").select("id, name, stock").order("name")).data ?? [],
  });

  const [reason, setReason] = useState("adjustment");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<Adj[]>([{ product_id: "", delta: 0 }]);

  const submit = async () => {
    const valid = rows.filter((r) => r.product_id && r.delta !== 0);
    if (!valid.length) return toast.error("Add at least one product with a non-zero change.");
    const payload = valid.map((r) => ({
      product_id: r.product_id,
      delta: r.delta,
      reason,
      note: note || null,
    }));
    const { error } = await supabase.from("stock_movements").insert(payload);
    if (error) return toast.error(error.message);
    await logActivity("stock.adjust", "stock_movements", undefined, { count: valid.length, reason });
    toast.success(`Recorded ${valid.length} stock ${valid.length === 1 ? "movement" : "movements"}.`);
    setRows([{ product_id: "", delta: 0 }]);
    setNote("");
    qc.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    qc.invalidateQueries({ queryKey: ["inventory-history"] });
    qc.invalidateQueries({ queryKey: ["inventory-stock-list"] });
    qc.invalidateQueries({ queryKey: ["adjust-products"] });
  };

  return (
    <div>
      <AdminPageHeader title="Stock adjustment" subtitle="Increase or decrease stock for one or more SKUs." />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-background p-5 shadow-soft">
          <div className="space-y-3">
            {rows.map((r, i) => {
              const p = products?.find((x) => x.id === r.product_id);
              return (
                <div key={i} className="grid grid-cols-12 items-center gap-2">
                  <select
                    value={r.product_id}
                    onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, product_id: e.target.value } : x)))}
                    className="col-span-6 rounded-full border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Choose product…</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (in stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={r.delta}
                    onChange={(e) => setRows((rs) => rs.map((x, idx) => (idx === i ? { ...x, delta: Number(e.target.value) } : x)))}
                    className="col-span-3 rounded-full border bg-background px-3 py-2 text-sm"
                    placeholder="Change (+/-)"
                  />
                  <div className="col-span-2 text-xs text-muted-foreground">
                    → {(p?.stock ?? 0) + r.delta}
                  </div>
                  <button
                    onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                    className="col-span-1 text-xs text-ruby hover:underline"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setRows((rs) => [...rs, { product_id: "", delta: 0 }])}
            className="mt-3 rounded-full border px-3 py-1.5 text-xs hover:bg-blush"
          >
            + Add row
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border bg-background p-5 shadow-soft">
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-full border bg-background px-3 py-2 text-sm">
              <option value="adjustment">Adjustment</option>
              <option value="damage">Damage / Loss</option>
              <option value="return">Customer return</option>
              <option value="correction">Count correction</option>
              <option value="transfer">Transfer</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Note (optional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full rounded-2xl border bg-background px-3 py-2 text-sm" />
          </label>
          <button onClick={submit} className="w-full rounded-full bg-rose-gradient px-4 py-2.5 text-sm text-primary-foreground shadow-luxe">
            Apply changes
          </button>
        </div>
      </div>
    </div>
  );
}
