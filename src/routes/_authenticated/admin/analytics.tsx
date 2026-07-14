import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, StatCard } from "@/components/admin/AdminPageHeader";
import { DateRangePicker, rangeFromPreset, type DatePreset, type DateRange } from "@/components/admin/DateRangePicker";
import { formatINR } from "@/lib/format";
import { useSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: Analytics,
});

const COLORS = ["#b76e79", "#e5c1b3", "#c9a56b", "#8b3a3a", "#f8edeb", "#5b3a29"];

function Analytics() {
  const settings = useSettings();
  const [preset, setPreset] = useState<{ preset: DatePreset; custom?: DateRange }>({ preset: "30d" });
  const range = rangeFromPreset(preset.preset, preset.custom);

  const { data } = useQuery({
    queryKey: ["analytics", range.start, range.end],
    queryFn: async () => {
      const [views, orders, items] = await Promise.all([
        supabase.from("page_views").select("path, referrer, session_id, created_at").gte("created_at", range.start).lte("created_at", range.end),
        supabase.from("orders").select("id, total, status, created_at").gte("created_at", range.start).lte("created_at", range.end),
        supabase.from("order_items").select("product_name, quantity, price, orders!inner(created_at, status)").gte("orders.created_at", range.start).lte("orders.created_at", range.end),
      ]);
      return { views: views.data ?? [], orders: orders.data ?? [], items: items.data ?? [] };
    },
  });

  const views = data?.views ?? [];
  const orders = data?.orders ?? [];
  const items = data?.items ?? [];

  const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
  const pageViews = views.length;
  const validOrders = orders.filter((o) => o.status !== "cancelled").length;
  const conversion = uniqueSessions ? (validOrders / uniqueSessions) * 100 : 0;

  const dailyViews = useMemo(() => {
    const m = new Map<string, { date: string; views: number; sessions: Set<string> }>();
    for (const v of views) {
      const k = new Date(v.created_at!).toISOString().slice(0, 10);
      const c = m.get(k) ?? { date: k, views: 0, sessions: new Set() };
      c.views += 1;
      if (v.session_id) c.sessions.add(v.session_id);
      m.set(k, c);
    }
    return Array.from(m.values()).map((r) => ({ date: r.date, views: r.views, visitors: r.sessions.size })).sort((a, b) => a.date.localeCompare(b.date));
  }, [views]);

  const topPaths = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of views) m.set(v.path, (m.get(v.path) ?? 0) + 1);
    return Array.from(m.entries()).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [views]);

  const traffic = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of views) {
      let src = "Direct";
      if (v.referrer) {
        try {
          const h = new URL(v.referrer).hostname.replace(/^www\./, "");
          if (h.includes("google")) src = "Google";
          else if (h.includes("facebook") || h.includes("fb")) src = "Facebook";
          else if (h.includes("instagram")) src = "Instagram";
          else if (h.includes("whatsapp")) src = "WhatsApp";
          else src = h;
        } catch { /* ignore */ }
      }
      m.set(src, (m.get(src) ?? 0) + 1);
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [views]);

  const topProducts = useMemo(() => {
    const m = new Map<string, { name: string; qty: number }>();
    for (const i of items) {
      const c = m.get(i.product_name) ?? { name: i.product_name, qty: 0 };
      c.qty += i.quantity;
      m.set(i.product_name, c);
    }
    return Array.from(m.values()).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [items]);

  // Simple funnel
  const cartViews = views.filter((v) => v.path.startsWith("/cart")).length;
  const checkoutViews = views.filter((v) => v.path.startsWith("/checkout")).length;

  return (
    <div>
      <AdminPageHeader title="Analytics" subtitle="Storefront traffic, conversion, and top content." />
      <div className="mb-4"><DateRangePicker value={preset} onChange={setPreset} /></div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visitors" value={uniqueSessions} />
        <StatCard label="Page views" value={pageViews} />
        <StatCard label="Orders" value={validOrders} />
        <StatCard label="Conversion" value={`${conversion.toFixed(2)}%`} />
      </div>

      <section className="mb-6 rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-4 font-display text-base uppercase tracking-widest">Visitors over time</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={dailyViews}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#b76e79" strokeWidth={2} name="Views" />
              <Line type="monotone" dataKey="visitors" stroke="#c9a56b" strokeWidth={2} name="Visitors" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Traffic sources</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={traffic} dataKey="value" nameKey="name" outerRadius={90} label>
                  {traffic.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Top products (units sold)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#b76e79" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Sales funnel</h2>
          <ul className="space-y-3 text-sm">
            <FunnelStep label="Visits" value={uniqueSessions} max={uniqueSessions} />
            <FunnelStep label="Cart views" value={cartViews} max={uniqueSessions} />
            <FunnelStep label="Checkout views" value={checkoutViews} max={uniqueSessions} />
            <FunnelStep label="Orders placed" value={validOrders} max={uniqueSessions} />
          </ul>
        </section>
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Top pages</h2>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground"><tr><th className="py-2">Path</th><th>Views</th></tr></thead>
            <tbody>
              {topPaths.map((p) => (
                <tr key={p.path} className="border-b last:border-0"><td className="py-2 truncate max-w-xs">{p.path}</td><td>{p.count}</td></tr>
              ))}
              {!topPaths.length && <tr><td colSpan={2} className="py-6 text-center text-muted-foreground">No traffic data yet.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>

      <section className="rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-2 font-display text-base uppercase tracking-widest">Integrations</h2>
        <p className="mb-3 text-xs text-muted-foreground">Configure IDs in Store Settings → Analytics.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <IntegrationRow label="Google Analytics ID" value={(settings as unknown as { analytics?: { ga_id?: string } }).analytics?.ga_id ?? ""} placeholder="G-XXXXXX" />
          <IntegrationRow label="Meta Pixel ID" value={(settings as unknown as { analytics?: { meta_pixel?: string } }).analytics?.meta_pixel ?? ""} placeholder="1234567890" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Order revenue in range: {formatINR(orders.reduce((s, o) => s + Number(o.total ?? 0), 0))}</p>
      </section>
    </div>
  );
}

function FunnelStep({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? (value / max) * 100 : 0;
  return (
    <li>
      <div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="text-muted-foreground">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-blush"><div className="h-full bg-rose-gradient" style={{ width: `${Math.min(100, pct)}%` }} /></div>
    </li>
  );
}

function IntegrationRow({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm">{value || <span className="text-muted-foreground">{placeholder}</span>}</div>
    </div>
  );
}
