import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { formatINR } from "@/lib/format";
import { logActivity } from "@/lib/log";

type Row = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
  orders: number;
  spent: number;
  last_order: string;
  blocked: boolean;
};

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: Customers,
});

function Customers() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, phone, created_at, blocked").order("created_at", { ascending: false }),
        supabase.from("orders").select("user_id, total, status, created_at"),
      ]);
      const byUser = new Map<string, { orders: number; spent: number; last: string }>();
      for (const o of orders.data ?? []) {
        if (!o.user_id) continue;
        if (o.status === "cancelled") continue;
        const cur = byUser.get(o.user_id) ?? { orders: 0, spent: 0, last: "" };
        cur.orders += 1;
        cur.spent += Number(o.total ?? 0);
        if (!cur.last || (o.created_at && o.created_at > cur.last)) cur.last = o.created_at!;
        byUser.set(o.user_id, cur);
      }
      const rows: Row[] = (profiles.data ?? []).map((p) => {
        const s = byUser.get(p.id) ?? { orders: 0, spent: 0, last: "" };
        return {
          id: p.id,
          full_name: p.full_name ?? "—",
          email: p.email,
          phone: p.phone ?? "—",
          created_at: p.created_at,
          orders: s.orders,
          spent: s.spent,
          last_order: s.last ? new Date(s.last).toLocaleDateString() : "—",
          blocked: p.blocked ?? false,
        };
      });
      return rows;
    },
  });

  const toggleBlock = async (r: Row) => {
    const { error } = await supabase.from("profiles").update({ blocked: !r.blocked }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity(r.blocked ? "customer.unblock" : "customer.block", "profiles", r.id);
    toast.success(r.blocked ? "Customer unblocked" : "Customer blocked");
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  };

  const del = async (r: Row) => {
    if (!confirm(`Delete customer profile for ${r.email}? Their orders remain.`)) return;
    const { error } = await supabase.from("profiles").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity("customer.delete", "profiles", r.id);
    qc.invalidateQueries({ queryKey: ["admin-customers"] });
  };

  const columns: Column<Row>[] = [
    { key: "full_name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "created_at", header: "Joined", render: (r) => new Date(r.created_at).toLocaleDateString() },
    { key: "orders", header: "Orders" },
    { key: "spent", header: "Spent", render: (r) => formatINR(r.spent) },
    { key: "last_order", header: "Last order" },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.blocked ? (
          <span className="rounded-full bg-ruby/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ruby">Blocked</span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-700">Active</span>
        ),
    },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-1">
          <Link to={"/admin/customers/$id" as never} params={{ id: r.id } as never} className="rounded-full border p-1.5 hover:bg-blush">
            <Eye className="h-3.5 w-3.5" />
          </Link>
          <button onClick={() => toggleBlock(r)} className="rounded-full border p-1.5 hover:bg-blush" title="Block/Unblock">
            <Ban className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => del(r)} className="rounded-full border p-1.5 text-ruby hover:bg-ruby/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        subtitle="Everyone who has registered with VAARAHI."
        actions={
          <Link to={"/admin/customers/analytics" as never} className="rounded-full border px-4 py-2 text-xs hover:bg-blush">
            View analytics →
          </Link>
        }
      />
      <DataTable rows={data ?? []} columns={columns} exportName="customers" pageSize={25} />
    </div>
  );
}
