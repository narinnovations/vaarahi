import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-champagne/40 text-charcoal",
  accepted: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-ruby/10 text-ruby",
};

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersAdmin,
});

function OrdersAdmin() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (pathname !== "/admin/orders") {
    return <Outlet />;
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-medium">Orders</h1>
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-background shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b bg-blush/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Order #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Total</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>
            )}
            {data?.map((o) => (
              <tr key={o.id} className="border-b last:border-0 hover:bg-blush/20">
                <td className="p-4 font-medium">{o.order_number}</td>
                <td className="p-4">
                  <div>{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.customer_phone}</div>
                </td>
                <td className="p-4">{new Date(o.created_at).toLocaleString("en-IN")}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? ""}`}>
                    {o.status}
                  </span>
                </td>
                <td className="p-4 text-right font-medium">{formatINR(Number(o.total))}</td>
                <td className="p-4 text-right">
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: o.id }}
                    className="rounded-full bg-charcoal px-4 py-1.5 text-xs text-pearl"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
