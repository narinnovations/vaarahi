import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, StatCard } from "@/components/admin/AdminPageHeader";
import { DateRangePicker, rangeFromPreset, type DatePreset, type DateRange } from "@/components/admin/DateRangePicker";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: Reports,
});

type Tab = "sales" | "revenue" | "gst" | "orders" | "products" | "customers" | "top-products" | "top-customers";
const TABS: { k: Tab; label: string }[] = [
  { k: "sales", label: "Sales" },
  { k: "revenue", label: "Revenue" },
  { k: "gst", label: "GST" },
  { k: "orders", label: "Orders" },
  { k: "products", label: "Products" },
  { k: "customers", label: "Customers" },
  { k: "top-products", label: "Top products" },
  { k: "top-customers", label: "Top customers" },
];

const COLORS = ["#b76e79", "#e5c1b3", "#c9a56b", "#8b3a3a", "#f8edeb", "#5b3a29"];

function Reports() {
  const [tab, setTab] = useState<Tab>("sales");
  const [preset, setPreset] = useState<{ preset: DatePreset; custom?: DateRange }>({ preset: "30d" });
  const range = rangeFromPreset(preset.preset, preset.custom);

  const { data } = useQuery({
    queryKey: ["reports", range.start, range.end],
    queryFn: async () => {
      const [orders, items] = await Promise.all([
        supabase.from("orders").select("*").gte("created_at", range.start).lte("created_at", range.end).order("created_at"),
        supabase.from("order_items").select("*, orders!inner(user_id, created_at, status)").gte("orders.created_at", range.start).lte("orders.created_at", range.end),
      ]);
      return { orders: orders.data ?? [], items: items.data ?? [] };
    },
  });

  const orders = data?.orders ?? [];
  const items = data?.items ?? [];

  const valid = orders.filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((s, o) => s + Number(o.total ?? 0), 0);
  const gst = valid.reduce((s, o) => s + Number(o.tax ?? 0), 0);
  const shipping = valid.reduce((s, o) => s + Number(o.shipping ?? 0), 0);
  const discount = valid.reduce((s, o) => s + Number(o.discount ?? 0), 0);

  const byDay = useMemo(() => {
    const m = new Map<string, { date: string; orders: number; revenue: number }>();
    for (const o of valid) {
      const k = new Date(o.created_at!).toISOString().slice(0, 10);
      const c = m.get(k) ?? { date: k, orders: 0, revenue: 0 };
      c.orders += 1;
      c.revenue += Number(o.total ?? 0);
      m.set(k, c);
    }
    return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [valid]);

  const byProduct = useMemo(() => {
    const m = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const i of items) {
      const c = m.get(i.product_name) ?? { name: i.product_name, qty: 0, revenue: 0 };
      c.qty += i.quantity;
      c.revenue += Number(i.price) * i.quantity;
      m.set(i.product_name, c);
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [items]);

  const byCustomer = useMemo(() => {
    const m = new Map<string, { name: string; orders: number; spent: number }>();
    for (const o of valid) {
      const c = m.get(o.customer_email) ?? { name: o.customer_name || o.customer_email, orders: 0, spent: 0 };
      c.orders += 1;
      c.spent += Number(o.total ?? 0);
      m.set(o.customer_email, c);
    }
    return Array.from(m.values()).sort((a, b) => b.spent - a.spent);
  }, [valid]);

  const statusBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of orders) m.set(o.status, (m.get(o.status) ?? 0) + 1);
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  return (
    <div>
      <AdminPageHeader
        title="Reports"
        subtitle="Sales, revenue, GST and product performance."
        actions={
          <button onClick={() => window.print()} className="rounded-full border px-4 py-2 text-xs hover:bg-blush">
            Print / PDF
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateRangePicker value={preset} onChange={setPreset} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={valid.length} hint={`${orders.length - valid.length} cancelled`} />
        <StatCard label="Revenue" value={formatINR(revenue)} />
        <StatCard label="GST collected" value={formatINR(gst)} />
        <StatCard label="Shipping" value={formatINR(shipping)} hint={`Discount ${formatINR(discount)}`} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b pb-3">
        {TABS.map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k)}
            className={`rounded-full px-4 py-1.5 text-xs transition ${tab === t.k ? "bg-rose-gradient text-primary-foreground" : "border hover:bg-blush"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === "sales" || tab === "revenue") && (
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">{tab === "sales" ? "Daily sales" : "Daily revenue"}</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, k: string) => (k === "revenue" ? formatINR(v) : v)} />
                <Line type="monotone" dataKey={tab === "sales" ? "orders" : "revenue"} stroke="#b76e79" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {tab === "orders" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border bg-background p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base uppercase tracking-widest">Status breakdown</h2>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" outerRadius={100} label>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-2xl border bg-background p-5 shadow-soft">
            <h2 className="mb-4 font-display text-base uppercase tracking-widest">Orders per day</h2>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#b76e79" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}

      {tab === "gst" && (
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">GST report</h2>
          <DataTable
            rows={valid.map((o) => ({
              order: o.order_number,
              date: new Date(o.created_at!).toLocaleDateString(),
              customer: o.customer_name,
              subtotal: Number(o.subtotal ?? 0),
              tax: Number(o.tax ?? 0),
              total: Number(o.total ?? 0),
            }))}
            columns={[
              { key: "order", header: "Order #" },
              { key: "date", header: "Date" },
              { key: "customer", header: "Customer" },
              { key: "subtotal", header: "Subtotal", render: (r) => formatINR(r.subtotal as number) },
              { key: "tax", header: "GST", render: (r) => formatINR(r.tax as number) },
              { key: "total", header: "Total", render: (r) => formatINR(r.total as number) },
            ] as Column<Record<string, unknown>>[]}
            exportName="gst-report"
            pageSize={25}
          />
        </section>
      )}

      {(tab === "products" || tab === "top-products") && (
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Product performance</h2>
          <DataTable
            rows={byProduct}
            columns={[
              { key: "name", header: "Product" },
              { key: "qty", header: "Units sold" },
              { key: "revenue", header: "Revenue", render: (r) => formatINR(r.revenue) },
            ] as Column<{ name: string; qty: number; revenue: number }>[]}
            exportName="product-report"
            pageSize={25}
          />
        </section>
      )}

      {(tab === "customers" || tab === "top-customers") && (
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-4 font-display text-base uppercase tracking-widest">Customer performance</h2>
          <DataTable
            rows={byCustomer}
            columns={[
              { key: "name", header: "Customer" },
              { key: "orders", header: "Orders" },
              { key: "spent", header: "Spent", render: (r) => formatINR(r.spent) },
            ] as Column<{ name: string; orders: number; spent: number }>[]}
            exportName="customer-report"
            pageSize={25}
          />
        </section>
      )}
    </div>
  );
}
