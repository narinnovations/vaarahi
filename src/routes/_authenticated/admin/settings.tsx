import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { AllSettings } from "@/lib/site-settings";
import { DEFAULT_SETTINGS } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsAdmin,
});

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*");
      const map: Record<string, unknown> = {};
      for (const row of data ?? []) map[row.key] = row.value;
      return map;
    },
  });

  const [store, setStore] = useState<AllSettings["store"]>(DEFAULT_SETTINGS.store);
  const [shipping, setShipping] = useState<{ flat_rate?: number; free_above?: number }>({});
  const [tax, setTax] = useState<{ gst_percent?: number }>({});
  const [announcement, setAnnouncement] = useState<AllSettings["announcement"]>(DEFAULT_SETTINGS.announcement);
  const [whatsapp, setWhatsapp] = useState<AllSettings["whatsapp"]>(DEFAULT_SETTINGS.whatsapp);
  const [reels_section, setReels] = useState<AllSettings["reels_section"]>(DEFAULT_SETTINGS.reels_section);
  const [footer, setFooter] = useState<AllSettings["footer"]>(DEFAULT_SETTINGS.footer);
  const [invoice, setInvoice] = useState<AllSettings["invoice"]>(DEFAULT_SETTINGS.invoice);
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setStore({ ...DEFAULT_SETTINGS.store, ...(data.store as object) } as AllSettings["store"]);
    setShipping((data.shipping as { flat_rate?: number; free_above?: number }) ?? {});
    setTax((data.tax as { gst_percent?: number }) ?? {});
    setAnnouncement({ ...DEFAULT_SETTINGS.announcement, ...(data.announcement as object) } as AllSettings["announcement"]);
    setWhatsapp({ ...DEFAULT_SETTINGS.whatsapp, ...(data.whatsapp as object) } as AllSettings["whatsapp"]);
    setReels({ ...DEFAULT_SETTINGS.reels_section, ...(data.reels_section as object) } as AllSettings["reels_section"]);
    setFooter({ ...DEFAULT_SETTINGS.footer, ...(data.footer as object) } as AllSettings["footer"]);
    setInvoice({ ...DEFAULT_SETTINGS.invoice, ...(data.invoice as object) } as AllSettings["invoice"]);
  }, [data]);

  const uploadLogo = async (file: File) => {
    setLogoBusy(true);
    const path = `branding/logo-${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      setLogoBusy(false);
      return;
    }
    const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    setStore((s) => ({ ...s, logo_url: url }));
    setLogoBusy(false);
    toast.success("Logo uploaded — click Save to apply");
  };

  const save = async () => {
    const rows: { key: string; value: unknown }[] = [
      { key: "store", value: store },
      { key: "shipping", value: shipping },
      { key: "tax", value: tax },
      { key: "announcement", value: announcement },
      { key: "whatsapp", value: whatsapp },
      { key: "reels_section", value: reels_section },
      { key: "footer", value: footer },
      { key: "invoice", value: invoice },
    ];
    for (const r of rows) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(r as never, { onConflict: "key" });
      if (error) return toast.error(error.message);
    }
    toast.success("All settings saved");
    qc.invalidateQueries({ queryKey: ["admin-settings"] });
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["store-settings"] });
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl tracking-[0.12em]">Store Settings</h1>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Brand & logo">
          <div>
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Logo</span>
            <div className="flex items-center gap-4">
              {store.logo_url ? (
                <img src={store.logo_url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-champagne/50" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-blush text-xs text-muted-foreground">No logo</div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs hover:bg-blush">
                <Upload className="h-3.5 w-3.5" />
                {logoBusy ? "Uploading…" : "Upload new"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </label>
              {store.logo_url && (
                <button
                  type="button"
                  onClick={() => setStore((s) => ({ ...s, logo_url: "" }))}
                  className="text-xs text-ruby hover:underline"
                >
                  Reset to default
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Applies to header, footer, admin sidebar and invoice.</p>
          </div>
          <TextRow label="Brand name" value={store.name} onChange={(v) => setStore({ ...store, name: v })} />
          <TextRow label="Tagline" value={store.tagline} onChange={(v) => setStore({ ...store, tagline: v })} />
        </Card>

        <Card title="Business info">
          <TextRow label="Address" value={store.address} onChange={(v) => setStore({ ...store, address: v })} textarea />
          <TextRow label="Phone" value={store.phone} onChange={(v) => setStore({ ...store, phone: v })} />
          <TextRow label="Email" value={store.email} onChange={(v) => setStore({ ...store, email: v })} />
          <TextRow label="WhatsApp (country code + number, no +)" value={store.whatsapp} onChange={(v) => setStore({ ...store, whatsapp: v })} />
          <TextRow label="Instagram handle (no @)" value={store.instagram} onChange={(v) => setStore({ ...store, instagram: v })} />
          <TextRow label="GSTIN (optional, shown on invoice)" value={store.gstin ?? ""} onChange={(v) => setStore({ ...store, gstin: v })} />
        </Card>

        <Card title="Shipping & Tax">
          <TextRow label="Flat shipping rate (₹)" type="number" value={shipping.flat_rate ?? ""} onChange={(v) => setShipping({ ...shipping, flat_rate: Number(v) })} />
          <TextRow label="Free shipping above (₹)" type="number" value={shipping.free_above ?? ""} onChange={(v) => setShipping({ ...shipping, free_above: Number(v) })} />
          <TextRow label="GST %" type="number" value={tax.gst_percent ?? ""} onChange={(v) => setTax({ ...tax, gst_percent: Number(v) })} />
        </Card>

        <Card title="Announcement bar">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={announcement.enabled} onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })} />
            Show scrolling announcement bar at top of site
          </label>
          <div>
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Announcements (one per line, emojis welcome)</span>
            <textarea
              className="input min-h-32"
              value={announcement.items.join("\n")}
              onChange={(e) => setAnnouncement({ ...announcement, items: e.target.value.split("\n").filter(Boolean) })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Background color</span>
              <input type="color" value={announcement.bg_color ?? "#1a1a1a"} onChange={(e) => setAnnouncement({ ...announcement, bg_color: e.target.value })} className="h-10 w-full rounded-lg border" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Text color</span>
              <input type="color" value={announcement.text_color ?? "#f7f1e8"} onChange={(e) => setAnnouncement({ ...announcement, text_color: e.target.value })} className="h-10 w-full rounded-lg border" />
            </label>
          </div>
          <TextRow
            label={`Scroll speed (seconds per loop, current: ${announcement.speed_seconds ?? 40}s)`}
            type="number"
            value={announcement.speed_seconds ?? 40}
            onChange={(v) => setAnnouncement({ ...announcement, speed_seconds: Math.max(10, Number(v) || 40) })}
          />
        </Card>

        <Card title="Invoice settings">
          <TextRow label="Invoice number prefix" value={invoice.invoice_prefix ?? ""} onChange={(v) => setInvoice({ ...invoice, invoice_prefix: v })} />
          <TextRow label="Signature line" value={invoice.signature_text ?? ""} onChange={(v) => setInvoice({ ...invoice, signature_text: v })} />
          <TextRow label="Footer / thank-you message" value={invoice.footer_message ?? ""} onChange={(v) => setInvoice({ ...invoice, footer_message: v })} textarea />
          <TextRow label="Return policy (printed on invoice)" value={invoice.return_policy ?? ""} onChange={(v) => setInvoice({ ...invoice, return_policy: v })} textarea />
          <TextRow label="Terms & conditions" value={invoice.terms ?? ""} onChange={(v) => setInvoice({ ...invoice, terms: v })} textarea />
        </Card>

        <Card title="WhatsApp floating button">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={whatsapp.enabled} onChange={(e) => setWhatsapp({ ...whatsapp, enabled: e.target.checked })} />
            Show WhatsApp floating button
          </label>
          <TextRow label="WhatsApp phone (country code + number, no +)" value={whatsapp.phone} onChange={(v) => setWhatsapp({ ...whatsapp, phone: v })} />
          <TextRow label="Greeting message" value={whatsapp.greeting} onChange={(v) => setWhatsapp({ ...whatsapp, greeting: v })} textarea />
        </Card>

        <Card title="Instagram reels section">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reels_section.enabled} onChange={(e) => setReels({ ...reels_section, enabled: e.target.checked })} />
            Show Instagram reels on homepage
          </label>
          <TextRow label="Section title" value={reels_section.title} onChange={(v) => setReels({ ...reels_section, title: v })} />
          <TextRow label="Section subtitle" value={reels_section.subtitle} onChange={(v) => setReels({ ...reels_section, subtitle: v })} />
        </Card>

        <Card title="Footer">
          <TextRow label="About us blurb" value={footer.about} onChange={(v) => setFooter({ ...footer, about: v })} textarea />
          <TextRow label="Google Maps URL" value={footer.maps_url ?? ""} onChange={(v) => setFooter({ ...footer, maps_url: v })} />
          <TextRow label="Facebook URL" value={footer.facebook ?? ""} onChange={(v) => setFooter({ ...footer, facebook: v })} />
          <TextRow label="YouTube URL" value={footer.youtube ?? ""} onChange={(v) => setFooter({ ...footer, youtube: v })} />
        </Card>
      </div>

      <div className="sticky bottom-0 mt-6 flex justify-end border-t bg-background/80 py-4 backdrop-blur">
        <button onClick={save} className="bg-rose-gradient text-primary-foreground rounded-full px-8 py-3 text-sm shadow-luxe">
          Save all settings
        </button>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:9999px;padding:.6rem 1.1rem;font-size:.875rem;outline:none}textarea.input{border-radius:1rem;font-family:inherit}`}</style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-background p-5 shadow-soft">
      <h2 className="mb-3 font-display text-base tracking-widest uppercase">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function TextRow({ label, value, onChange, type = "text", textarea }: { label: string; value: unknown; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  const v = value == null ? "" : String(value);
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-charcoal/70">{label}</span>
      {textarea ? (
        <textarea rows={3} className="input min-h-20" value={v} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className="input" value={v} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}
