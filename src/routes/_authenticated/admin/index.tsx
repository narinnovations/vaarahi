import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { Package, ShoppingBag, IndianRupee, Users, AlertTriangle } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { useMemo } from "react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [products, ordersAll, revenue, pending, recent, lowStock, growth] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at, status").gte("created_at", since),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }).limit(6),
        supabase.from("products").select("id, name, stock").lte("stock", 5).order("stock").limit(6),
        supabase.from("profiles").select("id, created_at").gte("created_at", since),
      ]);

      const valid = (revenue.data ?? []).filter((o) => o.status !== "cancelled");
      const rev = valid.reduce((s, r) => s + Number(r.total ?? 0), 0);

      const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
      for (const o of valid) {
        const k = new Date(o.created_at!).toISOString().slice(5, 10);
        const c = byDay.get(k) ?? { date: k, revenue: 0, orders: 0 };
        c.revenue += Number(o.total ?? 0);
        c.orders += 1;
        byDay.set(k, c);
      }
      const byDayCust = new Map<string, number>();
      for (const p of growth.data ?? []) {
        const k = new Date(p.created_at!).toISOString().slice(5, 10);
        byDayCust.set(k, (byDayCust.get(k) ?? 0) + 1);
      }

      return {
        products: products.count ?? 0,
        orders: ordersAll.count ?? 0,
        pending: pending.count ?? 0,
        revenue: rev,
        recent: recent.data ?? [],
        lowStock: lowStock.data ?? [],
        chart: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
        growth: Array.from(byDayCust.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      };
    },
  });

  const cards = useMemo(() => ([
    { label: "Revenue (30d)", value: formatINR(data?.revenue ?? 0), icon: IndianRupee },
    { label: "Total orders", value: data?.orders ?? 0, icon: ShoppingBag },
    { label: "Pending", value: data?.pending ?? 0, icon: Users },
    { label: "Products", value: data?.products ?? 0, icon: Package },
  ]), [data]);

  return (
    <div>
      <h1 className="font-display text-3xl tracking-[0.12em]">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-background p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Revenue (last 30 days)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={data?.chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#b76e79" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">New customers</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={data?.growth ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#c9a56b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border bg-background p-5 shadow-soft lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base uppercase tracking-widest">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr><th className="py-2">#</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {(data?.recent ?? []).map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{o.order_number}</td>
                  <td>{o.customer_name}</td>
                  <td><span className="rounded-full bg-blush px-2 py-0.5 text-[10px] uppercase tracking-wider">{o.status}</span></td>
                  <td className="text-right">{formatINR(Number(o.total ?? 0))}</td>
                </tr>
              ))}
              {!data?.recent?.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No orders yet.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-ruby" />
            <h2 className="font-display text-base uppercase tracking-widest">Low stock</h2>
          </div>
          <ul className="space-y-2 text-sm">
            {(data?.lowStock ?? []).map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span className="truncate">{p.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${(p.stock ?? 0) === 0 ? "bg-ruby text-ivory" : "bg-blush text-ruby"}`}>{p.stock ?? 0}</span>
              </li>
            ))}
            {!data?.lowStock?.length && <li className="py-6 text-center text-muted-foreground">All stocked up ✓</li>}
          </ul>
          <Link to="/admin/inventory/low-stock" className="mt-4 block text-center text-xs text-primary hover:underline">View inventory →</Link>
        </section>
      </div>
    </div>
  );
}
