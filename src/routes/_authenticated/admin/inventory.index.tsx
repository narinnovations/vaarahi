import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, StatCard } from "@/components/admin/AdminPageHeader";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/inventory/")({
  component: InventoryDashboard,
});

function InventoryDashboard() {
  const { data } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: async () => {
      const [prods, meta, moves] = await Promise.all([
        supabase.from("products").select("id, name, stock, price"),
        supabase.from("product_stock_meta").select("product_id, reserved, low_stock_threshold"),
        supabase
          .from("stock_movements")
          .select("id, product_id, delta, reason, note, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      return {
        products: prods.data ?? [],
        meta: meta.data ?? [],
        movements: moves.data ?? [],
      };
    },
  });

  const products = data?.products ?? [];
  const metaMap = new Map((data?.meta ?? []).map((m) => [m.product_id, m]));
  const totalSku = products.length;
  const totalUnits = products.reduce((s, p) => s + (p.stock ?? 0), 0);
  const totalValue = products.reduce((s, p) => s + (p.stock ?? 0) * Number(p.price ?? 0), 0);
  const outOfStock = products.filter((p) => (p.stock ?? 0) === 0).length;
  const lowStock = products.filter((p) => {
    const th = metaMap.get(p.id)?.low_stock_threshold ?? 5;
    return (p.stock ?? 0) > 0 && (p.stock ?? 0) <= th;
  }).length;

  return (
    <div>
      <AdminPageHeader title="Inventory dashboard" subtitle="At-a-glance stock health across your catalog." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="SKUs" value={totalSku} />
        <StatCard label="Total units" value={totalUnits} />
        <StatCard label="Inventory value" value={formatINR(totalValue)} />
        <StatCard label="Low stock" value={lowStock} hint="At or below threshold" />
        <StatCard label="Out of stock" value={outOfStock} />
      </div>

      <section className="mt-8 rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-4 font-display text-base uppercase tracking-widest">Recent stock movements</h2>
        {data?.movements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2">When</th>
                  <th>Product</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {data.movements.map((m) => {
                  const p = products.find((x) => x.id === m.product_id);
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 text-muted-foreground">{new Date(m.created_at!).toLocaleString()}</td>
                      <td>{p?.name ?? m.product_id.slice(0, 8)}</td>
                      <td className={m.delta > 0 ? "text-emerald-600" : "text-ruby"}>
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </td>
                      <td className="capitalize text-muted-foreground">{m.reason}</td>
                      <td className="text-muted-foreground">{m.note ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No movements yet.</p>
        )}
      </section>
    </div>
  );
}
