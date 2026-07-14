import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Row = {
  id: string;
  when: string;
  product: string;
  delta: number;
  reason: string;
  note: string;
};

export const Route = createFileRoute("/_authenticated/admin/inventory/history")({
  component: StockHistory,
});

function StockHistory() {
  const { data } = useQuery({
    queryKey: ["inventory-history"],
    queryFn: async () => {
      const [moves, prods] = await Promise.all([
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("products").select("id, name"),
      ]);
      const nameById = new Map((prods.data ?? []).map((p) => [p.id, p.name]));
      const rows: Row[] = (moves.data ?? []).map((m) => ({
        id: m.id,
        when: new Date(m.created_at!).toLocaleString(),
        product: nameById.get(m.product_id) ?? m.product_id.slice(0, 8),
        delta: m.delta,
        reason: m.reason,
        note: m.note ?? "",
      }));
      return rows;
    },
  });

  const columns: Column<Row>[] = [
    { key: "when", header: "When" },
    { key: "product", header: "Product" },
    {
      key: "delta",
      header: "Change",
      render: (r) => <span className={r.delta > 0 ? "text-emerald-600" : "text-ruby"}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>,
    },
    { key: "reason", header: "Reason" },
    { key: "note", header: "Note" },
  ];
  return (
    <div>
      <AdminPageHeader title="Stock movement history" subtitle="Complete audit trail of purchases, sales and adjustments." />
      <DataTable rows={data ?? []} columns={columns} exportName="stock-history" pageSize={25} />
    </div>
  );
}
