import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Row = { id: string; name: string; stock: number; threshold: number; status: string };

export const Route = createFileRoute("/_authenticated/admin/inventory/low-stock")({
  component: LowStock,
});

function LowStock() {
  const { data } = useQuery({
    queryKey: ["inventory-low"],
    queryFn: async () => {
      const [prods, meta] = await Promise.all([
        supabase.from("products").select("id, name, stock"),
        supabase.from("product_stock_meta").select("product_id, low_stock_threshold"),
      ]);
      const metaMap = new Map((meta.data ?? []).map((m) => [m.product_id, m]));
      const rows: Row[] = (prods.data ?? [])
        .map((p) => {
          const th = metaMap.get(p.id)?.low_stock_threshold ?? 5;
          const stock = p.stock ?? 0;
          return { id: p.id, name: p.name, stock, threshold: th, status: stock === 0 ? "Out" : "Low" };
        })
        .filter((r) => r.stock <= r.threshold)
        .sort((a, b) => a.stock - b.stock);
      return rows;
    },
  });

  const columns: Column<Row>[] = [
    { key: "name", header: "Product" },
    { key: "stock", header: "Stock" },
    { key: "threshold", header: "Threshold" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            r.status === "Out" ? "bg-ruby/20 text-ruby" : "bg-amber-100 text-amber-700"
          }`}
        >
          {r.status === "Out" ? "Out of stock" : "Low"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Low & out of stock" subtitle="Prioritised list of SKUs needing restock." />
      <DataTable rows={data ?? []} columns={columns} exportName="low-stock" />
    </div>
  );
}
