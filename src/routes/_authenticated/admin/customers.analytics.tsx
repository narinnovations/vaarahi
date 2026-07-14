import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LineChart as RLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, StatCard } from "@/components/admin/AdminPageHeader";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/customers/analytics")({
  component: CustomerAnalytics,
});

function CustomerAnalytics() {
  const { data } = useQuery({
    queryKey: ["customer-analytics"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        supabase.from("profiles").select("id, email, created_at"),
        supabase.from("orders").select("user_id, total, status, created_at"),
      ]);
      return { profiles: profiles.data ?? [], orders: orders.data ?? [] };
    },
  });

  const profiles = data?.profiles ?? [];
  const orders = data?.orders ?? [];

  // Growth by month
  const growthMap = new Map<string, number>();
  for (const p of profiles) {
    const k = new Date(p.created_at).toISOString().slice(0, 7);
    growthMap.set(k, (growthMap.get(k) ?? 0) + 1);
  }
  const growth = Array.from(growthMap.entries())
    .sort()
    .slice(-12)
    .map(([k, v]) => ({ month: k, customers: v }));

  // Top spenders
  const byUser = new Map<string, { email: string; spent: number; orders: number }>();
  const emailById = new Map(profiles.map((p) => [p.id, p.email]));
  for (const o of orders) {
    if (!o.user_id || o.status === "cancelled") continue;
    const cur = byUser.get(o.user_id) ?? { email: emailById.get(o.user_id) ?? "unknown", spent: 0, orders: 0 };
    cur.spent += Number(o.total ?? 0);
    cur.orders += 1;
    byUser.set(o.user_id, cur);
  }
  const topSpenders = Array.from(byUser.values()).sort((a, b) => b.spent - a.spent).slice(0, 10);
  const repeatRate = profiles.length
    ? (Array.from(byUser.values()).filter((v) => v.orders > 1).length / profiles.length) * 100
    : 0;

  return (
    <div>
      <AdminPageHeader title="Customer analytics" crumbs={[{ to: "/admin/customers", label: "Customers" }, { label: "Analytics" }]} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total customers" value={profiles.length} />
        <StatCard label="Repeat purchase rate" value={`${repeatRate.toFixed(1)}%`} />
        <StatCard label="Avg. lifetime value" value={formatINR(byUser.size ? Array.from(byUser.values()).reduce((s, v) => s + v.spent, 0) / byUser.size : 0)} />
      </div>

      <section className="mb-6 rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-4 font-display text-base uppercase tracking-widest">Customer growth</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <RLineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="customers" stroke="#b76e79" strokeWidth={2} />
            </RLineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-4 font-display text-base uppercase tracking-widest">Top spenders</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={topSpenders.map((s) => ({ name: s.email.split("@")[0], spent: s.spent }))}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="spent" fill="#b76e79" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
