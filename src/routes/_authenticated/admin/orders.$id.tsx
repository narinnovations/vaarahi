import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Printer, Check, X, Truck, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";

import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";
import { useSettings, useLogo } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const settings = useSettings();
  const logo = useLogo();

  const { data: order } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["admin-order-items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const setStatus = async (status: string) => {
    setBusy(true);
    const patch: TablesUpdate<"orders"> = { status };
    if (status === "shipped" && !order?.dispatch_date) patch.dispatch_date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Order marked as ${status}`);
    qc.invalidateQueries({ queryKey: ["admin-order", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const saveTracking = async (patch: TablesUpdate<"orders">) => {
    setBusy(true);
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Tracking updated");
    qc.invalidateQueries({ queryKey: ["admin-order", id] });
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };



  if (!order) return <div>Loading…</div>;

  return (
    <>
      <div className="no-print">
        <Link
          to="/admin/orders"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl font-medium">Order {order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              Placed {new Date(order.created_at).toLocaleString("en-IN")} · Status:{" "}
              <span className="font-medium capitalize">{order.status}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {order.status === "pending" && (
              <>
                <button disabled={busy} onClick={() => setStatus("accepted")} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white">
                  <Check className="h-4 w-4" /> Accept order
                </button>
                <button disabled={busy} onClick={() => setStatus("cancelled")} className="inline-flex items-center gap-2 rounded-full border border-ruby px-4 py-2 text-sm text-ruby">
                  <X className="h-4 w-4" /> Reject
                </button>
              </>
            )}
            {order.status === "accepted" && (
              <button disabled={busy} onClick={() => setStatus("shipped")} className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm text-white">
                <Truck className="h-4 w-4" /> Mark shipped
              </button>
            )}
            {order.status === "shipped" && (
              <button disabled={busy} onClick={() => setStatus("delivered")} className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm text-white">
                <PackageCheck className="h-4 w-4" /> Mark delivered
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-charcoal px-4 py-2 text-sm text-pearl"
            >
              <Printer className="h-4 w-4" /> Print Invoice
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border bg-background p-5 shadow-soft">
            <h2 className="mb-3 font-serif text-lg">Items</h2>
            <ul className="divide-y">
              {items?.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-3">
                  <img src={resolveImage(it.image)} alt="" className="h-12 w-12 rounded object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">Qty {it.quantity} × {formatINR(Number(it.price))}</div>
                  </div>
                  <div className="font-medium">{formatINR(Number(it.price) * it.quantity)}</div>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-background p-5 shadow-soft">
              <h3 className="mb-2 font-serif">Customer</h3>
              <div className="text-sm">
                <div className="font-medium">{order.customer_name}</div>
                <div className="text-muted-foreground">{order.customer_email}</div>
                <div className="text-muted-foreground">{order.customer_phone}</div>
              </div>
              <h3 className="mt-4 mb-2 font-serif">Delivery Address</h3>
              <p className="text-sm text-muted-foreground">
                {order.address_line1}
                {order.address_line2 ? `, ${order.address_line2}` : ""}<br />
                {order.city}, {order.state} — {order.pincode}
              </p>
            </div>
            <div className="rounded-2xl border bg-background p-5 shadow-soft text-sm">
              <Row l="Subtotal" v={formatINR(Number(order.subtotal))} />
              <Row l="Shipping" v={Number(order.shipping) === 0 ? "Free" : formatINR(Number(order.shipping))} />
              {Number(order.discount) > 0 && <Row l="Discount" v={`- ${formatINR(Number(order.discount))}`} />}
              {Number(order.tax) > 0 && <Row l="GST" v={formatINR(Number(order.tax))} />}
              <div className="mt-2 flex justify-between border-t pt-2 font-serif text-base">
                <span>Total</span><span>{formatINR(Number(order.total))}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Payment: {order.payment_method.toUpperCase()} · {order.payment_status}
              </p>
            </div>
            <TrackingCard order={order} onSave={saveTracking} busy={busy} />
          </div>
        </div>
      </div>


      {/* PRINT SHEET — two identical copies on one A4 */}
      <div className="print-sheet">
        <InvoiceCopy label="ORIGINAL COPY" order={order} items={items ?? []} store={settings.store} invoice={settings.invoice} logo={logo} />
        <div className="cut-line" aria-hidden />
        <InvoiceCopy label="CUSTOMER COPY" order={order} items={items ?? []} store={settings.store} invoice={settings.invoice} logo={logo} />
      </div>

      <PrintStyles />
    </>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{l}</span>
      <span>{v}</span>
    </div>
  );
}

function PrintStyles() {
  useEffect(() => {
    const id = "admin-print-styles";
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    const s = document.createElement("style");
    s.id = id;
    s.innerHTML = `
      .print-sheet { display: none; }
      @page { size: A4; margin: 0; }
      @media print {
        html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
        body * { visibility: hidden !important; }
        .print-sheet, .print-sheet * { visibility: visible !important; }
        .print-sheet {
          display: block !important;
          position: absolute; left: 0; top: 0;
          width: 210mm; min-height: 297mm;
          padding: 8mm 10mm;
          box-sizing: border-box;
          color: #111;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .no-print, .no-print * { display: none !important; }
        .invoice-copy { break-inside: avoid; page-break-inside: avoid; }
        .cut-line {
          border-top: 1.5px dashed #666;
          margin: 6mm 0;
          position: relative;
        }
        .cut-line::before {
          content: "✂  cut here";
          position: absolute; left: 50%; top: -8px;
          transform: translateX(-50%);
          background: #fff; padding: 0 8px;
          font-size: 9px; color: #666; letter-spacing: 2px;
        }
      }
      /* Screen preview */
      .print-sheet-preview .print-sheet { display: block; }
    `;
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);
  return null;
}

function InvoiceCopy({
  label,
  order,
  items,
  store,
  invoice,
  logo,
}: {
  label: string;
  order: any;
  items: any[];
  store: any;
  invoice: any;
  logo: string;
}) {
  const invNo = `${invoice.invoice_prefix || "INV"}-${order.order_number}`;
  return (
    <div className="invoice-copy" style={{ fontSize: 10.5, lineHeight: 1.35 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: "1.5px solid #111", paddingBottom: 6, marginBottom: 8 }}>
        <img src={logo} alt="" style={{ width: 46, height: 46, objectFit: "contain" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, letterSpacing: 3, fontWeight: 600 }}>
            {store.name || "VAARAHI"}
          </div>
          <div style={{ fontSize: 9, color: "#555" }}>{store.tagline}</div>
          <div style={{ fontSize: 9, color: "#555", marginTop: 1 }}>{store.address}</div>
          <div style={{ fontSize: 9, color: "#555" }}>
            📞 {store.phone}{store.email ? ` · ✉ ${store.email}` : ""}{store.gstin ? ` · GSTIN: ${store.gstin}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>TAX INVOICE</div>
          <div style={{ fontSize: 9, color: "#888", letterSpacing: 2, marginTop: 2 }}>{label}</div>
        </div>
      </div>

      {/* Meta + Bill To */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: 1.5, color: "#888", marginBottom: 2 }}>Bill To</div>
          <div style={{ fontWeight: 600 }}>{order.customer_name}</div>
          <div>{order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ""}</div>
          <div>{order.city}, {order.state} — {order.pincode}</div>
          <div>📞 {order.customer_phone}</div>
          {order.customer_email && <div>✉ {order.customer_email}</div>}
        </div>
        <div style={{ minWidth: 180 }}>
          <MetaRow k="Invoice #" v={invNo} />
          <MetaRow k="Order #" v={order.order_number} />
          <MetaRow k="Date" v={new Date(order.created_at).toLocaleDateString("en-IN")} />
          <MetaRow k="Payment" v={`${(order.payment_method || "").toUpperCase()} · ${order.payment_status}`} />
        </div>
      </div>

      {/* Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead>
          <tr style={{ background: "#f3ede4", borderBottom: "1px solid #999" }}>
            <th style={th}>#</th>
            <th style={{ ...th, textAlign: "left" }}>Product</th>
            <th style={th}>Qty</th>
            <th style={th}>Price</th>
            <th style={th}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={it.id} style={{ borderBottom: "1px dotted #ccc" }}>
              <td style={td}>{i + 1}</td>
              <td style={{ ...td, textAlign: "left" }}>{it.product_name}</td>
              <td style={td}>{it.quantity}</td>
              <td style={td}>{formatINR(Number(it.price))}</td>
              <td style={td}>{formatINR(Number(it.price) * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
        <table style={{ fontSize: 10, minWidth: 220 }}>
          <tbody>
            <TR k="Subtotal" v={formatINR(Number(order.subtotal))} />
            {Number(order.discount) > 0 && <TR k="Discount" v={`- ${formatINR(Number(order.discount))}`} />}
            <TR k="Shipping" v={Number(order.shipping) === 0 ? "FREE" : formatINR(Number(order.shipping))} />
            {Number(order.tax) > 0 && <TR k="GST" v={formatINR(Number(order.tax))} />}
            <tr style={{ borderTop: "1.5px solid #111", fontWeight: 700, fontSize: 11 }}>
              <td style={{ padding: "4px 6px" }}>GRAND TOTAL</td>
              <td style={{ padding: "4px 6px", textAlign: "right" }}>{formatINR(Number(order.total))}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Policy + signature */}
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 8.5, color: "#555" }}>
        <div style={{ flex: 1 }}>
          {invoice.return_policy && (
            <>
              <div style={{ fontWeight: 600, color: "#111", marginBottom: 2 }}>Return Policy</div>
              <div>{invoice.return_policy}</div>
            </>
          )}
          {invoice.terms && (
            <>
              <div style={{ fontWeight: 600, color: "#111", marginTop: 4, marginBottom: 2 }}>Terms</div>
              <div>{invoice.terms}</div>
            </>
          )}
        </div>
        <div style={{ minWidth: 140, textAlign: "center", alignSelf: "flex-end" }}>
          <div style={{ borderTop: "1px solid #333", paddingTop: 3, marginTop: 24 }}>
            {invoice.signature_text || `For ${store.name}`}
            <div style={{ fontSize: 8, color: "#888" }}>Authorised Signatory</div>
          </div>
        </div>
      </div>

      {invoice.footer_message && (
        <div style={{ marginTop: 6, textAlign: "center", fontSize: 9, fontStyle: "italic", color: "#666" }}>
          {invoice.footer_message}
        </div>
      )}
    </div>
  );
}

function MetaRow({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, borderBottom: "1px dotted #ddd", padding: "2px 0" }}>
      <span style={{ color: "#666" }}>{k}</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}
function TR({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td style={{ padding: "2px 6px", color: "#555" }}>{k}</td>
      <td style={{ padding: "2px 6px", textAlign: "right" }}>{v}</td>
    </tr>
  );
}
const th: React.CSSProperties = { padding: "4px 6px", textAlign: "center", fontSize: 9, textTransform: "uppercase", letterSpacing: 1 };
const td: React.CSSProperties = { padding: "4px 6px", textAlign: "center" };

function TrackingCard({
  order,
  onSave,
  busy,
}: {
  order: { courier_name: string | null; tracking_number: string | null; tracking_url: string | null; dispatch_date: string | null; estimated_delivery_date: string | null; shipping_notes: string | null };
  onSave: (patch: TablesUpdate<"orders">) => void;
  busy: boolean;
}) {
  const [f, setF] = useState({
    courier_name: order.courier_name ?? "",
    tracking_number: order.tracking_number ?? "",
    tracking_url: order.tracking_url ?? "",
    dispatch_date: order.dispatch_date ?? "",
    estimated_delivery_date: order.estimated_delivery_date ?? "",
    shipping_notes: order.shipping_notes ?? "",
  });
  useEffect(() => {
    setF({
      courier_name: order.courier_name ?? "",
      tracking_number: order.tracking_number ?? "",
      tracking_url: order.tracking_url ?? "",
      dispatch_date: order.dispatch_date ?? "",
      estimated_delivery_date: order.estimated_delivery_date ?? "",
      shipping_notes: order.shipping_notes ?? "",
    });
  }, [order]);
  const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
  const label = "text-[10px] uppercase tracking-wider text-muted-foreground";
  return (
    <div className="rounded-2xl border bg-background p-5 shadow-soft">
      <h3 className="mb-3 font-serif">Shipment Tracking</h3>
      <div className="grid gap-3 text-sm">
        <label className="block">
          <span className={label}>Courier</span>
          <input className={input} value={f.courier_name} onChange={(e) => setF({ ...f, courier_name: e.target.value })} placeholder="Delhivery / DTDC / India Post" />
        </label>
        <label className="block">
          <span className={label}>Tracking number</span>
          <input className={input} value={f.tracking_number} onChange={(e) => setF({ ...f, tracking_number: e.target.value })} />
        </label>
        <label className="block">
          <span className={label}>Tracking URL</span>
          <input className={input} value={f.tracking_url} onChange={(e) => setF({ ...f, tracking_url: e.target.value })} placeholder="https://…" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Dispatched on</span>
            <input type="date" className={input} value={f.dispatch_date} onChange={(e) => setF({ ...f, dispatch_date: e.target.value })} />
          </label>
          <label className="block">
            <span className={label}>Est. delivery</span>
            <input type="date" className={input} value={f.estimated_delivery_date} onChange={(e) => setF({ ...f, estimated_delivery_date: e.target.value })} />
          </label>
        </div>
        <label className="block">
          <span className={label}>Notes for customer</span>
          <textarea className={input} rows={2} value={f.shipping_notes} onChange={(e) => setF({ ...f, shipping_notes: e.target.value })} />
        </label>
        <button
          disabled={busy}
          onClick={() =>
            onSave({
              courier_name: f.courier_name || null,
              tracking_number: f.tracking_number || null,
              tracking_url: f.tracking_url || null,
              dispatch_date: f.dispatch_date || null,
              estimated_delivery_date: f.estimated_delivery_date || null,
              shipping_notes: f.shipping_notes || null,
            })
          }
          className="mt-1 rounded-full bg-charcoal px-4 py-2 text-sm text-pearl disabled:opacity-50"
        >
          Save tracking
        </button>
      </div>
    </div>
  );
}

