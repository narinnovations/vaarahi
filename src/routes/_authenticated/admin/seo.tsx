import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  component: SeoAdmin,
});

type Scope = "global" | "home" | "category" | "product" | "page";
type SeoEntry = {
  id: string;
  scope: Scope;
  ref_id: string;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  canonical_url: string | null;
  og_image: string | null;
  twitter_card: string | null;
  robots: string | null;
  schema_json: unknown;
};

function empty(): SeoEntry {
  return { id: "", scope: "page", ref_id: "", meta_title: "", meta_description: "", keywords: "", canonical_url: "", og_image: "", twitter_card: "summary_large_image", robots: "index, follow", schema_json: null };
}

function SeoAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["seo-entries"],
    queryFn: async () => {
      const { data } = await supabase.from("seo_entries").select("*").order("scope");
      return (data ?? []) as unknown as SeoEntry[];
    },
  });
  const [editing, setEditing] = useState<SeoEntry | null>(null);
  const [tab, setTab] = useState<"entries" | "robots" | "sitemap">("entries");

  const rows = useMemo(() => data ?? [], [data]);

  const save = async () => {
    if (!editing) return;
    const { id, ...rest } = editing;
    const { error } = id
      ? await supabase.from("seo_entries").update(rest as never).eq("id", id)
      : await supabase.from("seo_entries").insert(rest as never);
    if (error) return toast.error(error.message);
    toast.success("SEO entry saved");
    qc.invalidateQueries({ queryKey: ["seo-entries"] });
    setEditing(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete SEO entry?")) return;
    const { error } = await supabase.from("seo_entries").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["seo-entries"] });
  };

  return (
    <div>
      <AdminPageHeader
        title="SEO management"
        subtitle="Meta tags, OpenGraph, robots and structured data."
        actions={
          <button onClick={() => setEditing(empty())} className="rounded-full bg-rose-gradient px-5 py-2 text-xs text-primary-foreground shadow-soft">
            + New entry
          </button>
        }
      />

      <div className="mb-4 flex gap-2 border-b pb-3">
        {(["entries", "robots", "sitemap"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-xs ${tab === t ? "bg-rose-gradient text-primary-foreground" : "border hover:bg-blush"}`}>{t}</button>
        ))}
      </div>

      {tab === "entries" && (
        <DataTable
          rows={rows}
          columns={[
            { key: "scope", header: "Scope" },
            { key: "ref_id", header: "Target", render: (r) => r.ref_id || "—" },
            { key: "meta_title", header: "Title", render: (r) => r.meta_title || "—" },
            { key: "actions", header: "", sortable: false, render: (r) => (
              <div className="flex gap-2">
                <button onClick={() => setEditing(r)} className="rounded-full border px-3 py-1 text-xs">Edit</button>
                <button onClick={() => remove(r.id)} className="rounded-full border px-3 py-1 text-xs text-ruby">Delete</button>
              </div>
            ) },
          ] as Column<SeoEntry>[]}
          exportName="seo-entries"
        />
      )}

      {tab === "robots" && (
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-3 font-display text-base uppercase tracking-widest">robots.txt</h2>
          <p className="mb-2 text-xs text-muted-foreground">Edit <code>public/robots.txt</code> in your project files.</p>
          <pre className="rounded-xl border bg-blush/40 p-4 text-xs">{`User-agent: *\nAllow: /\nSitemap: /sitemap.xml`}</pre>
        </section>
      )}

      {tab === "sitemap" && (
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <h2 className="mb-3 font-display text-base uppercase tracking-widest">Sitemap</h2>
          <p className="text-sm text-muted-foreground">Regenerate <code>public/sitemap.xml</code> from published products, categories and pages.</p>
        </section>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border bg-background shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <div className="border-b p-5"><h3 className="font-display text-lg tracking-widest uppercase">{editing.id ? "Edit" : "New"} SEO entry</h3></div>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Scope</span>
                <select value={editing.scope} onChange={(e) => setEditing({ ...editing, scope: e.target.value as Scope })} className="w-full rounded-full border bg-background px-4 py-2 text-sm">
                  <option value="global">Global</option><option value="home">Home</option><option value="category">Category</option><option value="product">Product</option><option value="page">Page</option>
                </select>
              </label>
              <F label="Target (slug or path)" v={editing.ref_id} on={(v) => setEditing({ ...editing, ref_id: v })} />
              <F label="Meta title" v={editing.meta_title ?? ""} on={(v) => setEditing({ ...editing, meta_title: v })} />
              <F label="Meta description" v={editing.meta_description ?? ""} on={(v) => setEditing({ ...editing, meta_description: v })} textarea />
              <F label="Keywords" v={editing.keywords ?? ""} on={(v) => setEditing({ ...editing, keywords: v })} />
              <F label="OG / social image URL" v={editing.og_image ?? ""} on={(v) => setEditing({ ...editing, og_image: v })} />
              <F label="Canonical URL" v={editing.canonical_url ?? ""} on={(v) => setEditing({ ...editing, canonical_url: v })} />
              <F label="Twitter card type" v={editing.twitter_card ?? ""} on={(v) => setEditing({ ...editing, twitter_card: v })} />
              <F label="Robots" v={editing.robots ?? ""} on={(v) => setEditing({ ...editing, robots: v })} />
              <label className="block">
                <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">JSON-LD structured data</span>
                <textarea rows={6} defaultValue={editing.schema_json ? JSON.stringify(editing.schema_json, null, 2) : ""} onBlur={(e) => { try { setEditing({ ...editing, schema_json: e.target.value ? JSON.parse(e.target.value) : null }); } catch { toast.error("Invalid JSON"); } }} className="w-full rounded-xl border bg-background p-3 font-mono text-xs" placeholder='{"@context":"https://schema.org"}' />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <button onClick={() => setEditing(null)} className="rounded-full border px-4 py-2 text-xs">Cancel</button>
              <button onClick={save} className="rounded-full bg-rose-gradient px-5 py-2 text-xs text-primary-foreground shadow-soft">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, v, on, textarea }: { label: string; v: string; on: (v: string) => void; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {textarea ? <textarea rows={3} className="w-full rounded-xl border bg-background p-3 text-sm" value={v} onChange={(e) => on(e.target.value)} /> : <input className="w-full rounded-full border bg-background px-4 py-2 text-sm" value={v} onChange={(e) => on(e.target.value)} />}
    </label>
  );
}
