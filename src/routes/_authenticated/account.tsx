import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { LogOut, ShieldCheck, Check, Package, Truck, PackageCheck, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — Vaarahi" }, { name: "robots", content: "noindex" }] }),
  component: AccountPage,
});

function AccountPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const { user, isAdmin, signOut } = useAuth();

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total, status, created_at, courier_name, tracking_number, tracking_url, dispatch_date, estimated_delivery_date, shipping_notes")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  if (pathname !== "/account") {
    return <Outlet />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-medium">My Account</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="bg-charcoal text-pearl inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Admin Panel
            </Link>
          )}
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
        <h2 className="mb-4 font-serif text-2xl">Order history</h2>
        {!orders || orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            You haven't placed any orders yet.
          </p>
        ) : (
          <ul className="space-y-4">
            {orders.map((o) => (
              <Link
                key={o.id}
                to="/account/$id"
                params={{ id: o.id }}
                className="block rounded-xl border border-border/60 bg-background p-4 transition hover:border-primary hover:shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">Order {o.order_number}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("en-IN")} · <span className="capitalize">{o.status}</span>
                    </div>
                  </div>
                  <div className="font-serif text-lg">{formatINR(o.total)}</div>
                </div>

                {o.status !== "cancelled" && (
                  <ShippingTimeline
                    status={o.status}
                    dispatch={o.dispatch_date}
                    eta={o.estimated_delivery_date}
                  />
                )}

                {(o.tracking_number || o.courier_name || o.tracking_url || o.shipping_notes) && (
                  <div className="mt-3 rounded-lg bg-blush/30 p-3 text-xs">
                    {o.courier_name && (
                      <div><span className="text-muted-foreground">Courier:</span> <span className="font-medium">{o.courier_name}</span></div>
                    )}
                    {o.tracking_number && (
                      <div><span className="text-muted-foreground">Tracking #:</span> <span className="font-medium">{o.tracking_number}</span></div>
                    )}
                    {o.tracking_url && (
                      <a
                        href={o.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 font-medium text-primary hover:underline"
                      >
                        Track shipment <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {o.shipping_notes && (
                      <div className="mt-1 text-muted-foreground italic">{o.shipping_notes}</div>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const STEPS = [
  { key: "pending", label: "Placed", Icon: Check },
  { key: "accepted", label: "Confirmed", Icon: Package },
  { key: "shipped", label: "Shipped", Icon: Truck },
  { key: "delivered", label: "Delivered", Icon: PackageCheck },
] as const;

function ShippingTimeline({
  status,
  dispatch,
  eta,
}: {
  status: string;
  dispatch: string | null;
  eta: string | null;
}) {
  const idx = STEPS.findIndex((s) => s.key === status);
  const active = idx < 0 ? 0 : idx;
  return (
    <div className="mt-4">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const done = i <= active;
          return (
            <div key={s.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full border-2 ${done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                    }`}
                >
                  <s.Icon className="h-4 w-4" />
                </div>
                <div className={`mt-1 text-[10px] uppercase tracking-wider ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {s.label}
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < active ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
      {(dispatch || eta) && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {dispatch && <span>Dispatched: <span className="text-foreground font-medium">{new Date(dispatch).toLocaleDateString("en-IN")}</span></span>}
          {eta && <span>Estimated delivery: <span className="text-foreground font-medium">{new Date(eta).toLocaleDateString("en-IN")}</span></span>}
        </div>
      )}
    </div>
  );
}
