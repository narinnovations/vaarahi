import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

type Row = {
  id: string;
  name: string;
  slug: string;
  category_slug: string;
  price: number;
  stock: number;
  reserved: number;
  available: number;
  threshold: number;
  status: string;
};

export const Route = createFileRoute("/_authenticated/admin/inventory/products")({
  component: StockList,
});

function StockList() {
  const { data } = useQuery({
    queryKey: ["inventory-stock-list"],
    queryFn: async () => {
      const [prods, meta] = await Promise.all([
        supabase.from("products").select("id, name, slug, category_slug, price, stock").order("name"),
        supabase.from("product_stock_meta").select("product_id, reserved, low_stock_threshold"),
      ]);
      const metaMap = new Map((meta.data ?? []).map((m) => [m.product_id, m]));
      const rows: Row[] = (prods.data ?? []).map((p) => {
        const m = metaMap.get(p.id);
        const reserved = m?.reserved ?? 0;
        const threshold = m?.low_stock_threshold ?? 5;
        const available = Math.max(0, (p.stock ?? 0) - reserved);
        const status =
          (p.stock ?? 0) === 0 ? "Out of stock" : (p.stock ?? 0) <= threshold ? "Low" : "In stock";
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          category_slug: p.category_slug,
          price: Number(p.price ?? 0),
          stock: p.stock ?? 0,
          reserved,
          available,
          threshold,
          status,
        };
      });
      return rows;
    },
  });

  const columns: Column<Row>[] = [
    { key: "name", header: "Product", accessor: (r) => r.name },
    { key: "category_slug", header: "Category" },
    { key: "stock", header: "Current" },
    { key: "reserved", header: "Reserved" },
    { key: "available", header: "Available" },
    { key: "threshold", header: "Threshold" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            r.status === "In stock"
              ? "bg-emerald-100 text-emerald-700"
              : r.status === "Low"
                ? "bg-amber-100 text-amber-700"
                : "bg-ruby/20 text-ruby"
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Product stock list" subtitle="All SKUs with current, reserved, and available units." />
      <DataTable rows={data ?? []} columns={columns} exportName="stock-list" pageSize={25} />
    </div>
  );
}
