import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader, StatCard } from "@/components/admin/AdminPageHeader";
import { formatINR } from "@/lib/format";
import { logActivity } from "@/lib/log";

export const Route = createFileRoute("/_authenticated/admin/customers/$id")({
  component: CustomerDetail,
});

type Tab = "overview" | "addresses" | "orders" | "wishlist" | "reviews" | "notes";

function CustomerDetail() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [newNote, setNewNote] = useState("");

  const { data, refetch } = useQuery({
    queryKey: ["customer-detail", id],
    queryFn: async () => {
      const [profile, addresses, orders, wishlist, reviews, notes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("customer_addresses").select("*").eq("user_id", id).order("is_default", { ascending: false }),
        supabase.from("orders").select("id, order_number, status, total, created_at").eq("user_id", id).order("created_at", { ascending: false }),
        supabase.from("wishlists").select("id, product_id, created_at, products(name, slug, price)").eq("user_id", id),
        supabase.from("reviews").select("id, rating, title, body, approved, product_id, created_at, products(name)").eq("user_id", id),
        supabase.from("customer_notes").select("*").eq("profile_id", id).order("created_at", { ascending: false }),
      ]);
      return {
        profile: profile.data,
        addresses: addresses.data ?? [],
        orders: orders.data ?? [],
        wishlist: wishlist.data ?? [],
        reviews: reviews.data ?? [],
        notes: notes.data ?? [],
      };
    },
  });

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("customer_notes").insert({ profile_id: id, note: newNote.trim(), author_id: u.user?.id });
    if (error) return toast.error(error.message);
    await logActivity("customer_note.add", "customer_notes", id);
    setNewNote("");
    refetch();
  };

  if (!data?.profile) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const p = data.profile;
  const totalSpent = data.orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total ?? 0), 0);
  const clv = totalSpent; // simple lifetime value

  const tabs: { k: Tab; label: string; badge?: number }[] = [
    { k: "overview", label: "Overview" },
    { k: "addresses", label: "Addresses", badge: data.addresses.length },
    { k: "orders", label: "Orders", badge: data.orders.length },
    { k: "wishlist", label: "Wishlist", badge: data.wishlist.length },
    { k: "reviews", label: "Reviews", badge: data.reviews.length },
    { k: "notes", label: "Notes", badge: data.notes.length },
  ];

  return (
    <div>
      <AdminPageHeader
        title={p.full_name ?? p.email}
        subtitle={p.email}
        crumbs={[{ to: "/admin/customers", label: "Customers" }, { label: p.email }]}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={data.orders.length} />
        <StatCard label="Total spent" value={formatINR(totalSpent)} />
        <StatCard label="Lifetime value" value={formatINR(clv)} />
        <StatCard label="Joined" value={new Date(p.created_at).toLocaleDateString()} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`rounded-full px-4 py-1.5 text-xs transition ${tab === t.k ? "bg-rose-gradient text-primary-foreground" : "border hover:bg-blush"}`}>
            {t.label} {t.badge !== undefined && <span className="ml-1 text-muted-foreground/80">({t.badge})</span>}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-background p-5 shadow-soft">
        {tab === "overview" && (
          <dl className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name" value={p.full_name ?? "—"} />
            <Field label="Email" value={p.email} />
            <Field label="Phone" value={p.phone ?? "—"} />
            <Field label="Status" value={p.blocked ? "Blocked" : "Active"} />
          </dl>
        )}
        {tab === "addresses" && (
          data.addresses.length ? (
            <ul className="space-y-3">
              {data.addresses.map((a) => (
                <li key={a.id} className="rounded-xl border p-3 text-sm">
                  <div className="font-medium">{a.label ?? "Address"} {a.is_default && <span className="ml-2 text-xs text-champagne-foreground">Default</span>}</div>
                  <div className="text-muted-foreground">{a.full_name} · {a.phone}</div>
                  <div>{a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ""}, {a.city}, {a.state} {a.pincode}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No saved addresses.</p>
        )}
        {tab === "orders" && (
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">Order</th><th>Date</th><th>Status</th><th>Total</th><th></th></tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2">{o.order_number}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="capitalize">{o.status}</td>
                  <td>{formatINR(Number(o.total))}</td>
                  <td><Link to={"/admin/orders/$id" as never} params={{ id: o.id } as never} className="text-xs text-champagne-foreground underline">View</Link></td>
                </tr>
              ))}
              {!data.orders.length && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No orders</td></tr>}
            </tbody>
          </table>
        )}
        {tab === "wishlist" && (
          data.wishlist.length ? (
            <ul className="grid gap-2">
              {data.wishlist.map((w) => (
                <li key={w.id} className="flex justify-between rounded border p-3 text-sm">
                  <span>{(w.products as { name?: string } | null)?.name ?? "Product removed"}</span>
                  <span className="text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Wishlist is empty.</p>
        )}
        {tab === "reviews" && (
          data.reviews.length ? (
            <ul className="space-y-3">
              {data.reviews.map((r) => (
                <li key={r.id} className="rounded-xl border p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{(r.products as { name?: string } | null)?.name}</span>
                    <span className="text-champagne-foreground">{"★".repeat(r.rating)}</span>
                  </div>
                  {r.title && <div className="mt-1 font-medium">{r.title}</div>}
                  {r.body && <p className="mt-1 text-muted-foreground">{r.body}</p>}
                  <div className="mt-1 text-xs text-muted-foreground">{r.approved ? "Approved" : "Pending"}</div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No reviews from this customer.</p>
        )}
        {tab === "notes" && (
          <div>
            <div className="mb-4 flex gap-2">
              <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add internal note…" className="flex-1 rounded-full border bg-background px-3 py-2 text-sm" />
              <button onClick={addNote} className="rounded-full bg-rose-gradient px-4 py-2 text-xs text-primary-foreground">Add</button>
            </div>
            {data.notes.length ? (
              <ul className="space-y-2">
                {data.notes.map((n) => (
                  <li key={n.id} className="rounded-xl border p-3 text-sm">
                    <div className="text-muted-foreground text-xs">{new Date(n.created_at).toLocaleString()}</div>
                    <div className="mt-1">{n.note}</div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No notes yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}
