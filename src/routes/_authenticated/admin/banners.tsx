import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  component: BannersAdmin,
});

type BannerForm = {
  title: string;
  subtitle: string;
  eyebrow: string;
  image_url: string;
  cta_label: string;
  cta_link: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
};

const empty: BannerForm = {
  title: "",
  subtitle: "",
  eyebrow: "",
  image_url: "",
  cta_label: "Shop Now",
  cta_link: "/products",
  active: true,
  starts_at: "",
  ends_at: "",
};

function BannersAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  const [f, setF] = useState<BannerForm>(empty);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    const path = `banners/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
    setF((s) => ({ ...s, image_url: pub.publicUrl }));
    setBusy(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.image_url) return toast.error("Please upload or provide a banner image");
    const nextOrder = (data[data.length - 1]?.sort_order ?? -1) + 1;
    const { error } = await supabase.from("banners").insert({
      ...f,
      starts_at: f.starts_at || null,
      ends_at: f.ends_at || null,
      sort_order: nextOrder,
    });
    if (error) return toast.error(error.message);
    toast.success("Banner added");
    setF(empty);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("banners").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = data[idx + dir];
    const cur = data[idx];
    if (!target || !cur) return;
    await Promise.all([
      supabase.from("banners").update({ sort_order: target.sort_order }).eq("id", cur.id),
      supabase.from("banners").update({ sort_order: cur.sort_order }).eq("id", target.id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin-banners"] });
    qc.invalidateQueries({ queryKey: ["banners"] });
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl tracking-[0.12em]">Hero Banners</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Banners scroll automatically on the homepage. Reorder, hide, or schedule them anytime.
      </p>

      <form onSubmit={add} className="mb-8 grid gap-3 rounded-2xl border bg-background p-5 shadow-soft sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Banner image</label>
          {f.image_url ? (
            <div className="relative overflow-hidden rounded-xl border">
              <img src={f.image_url} alt="" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => setF({ ...f, image_url: "" })}
                className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs shadow"
              >
                Change
              </button>
            </div>
          ) : (
            <label className={`flex h-32 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-blush/30 text-sm text-muted-foreground hover:border-primary ${busy ? "opacity-50" : ""}`}>
              <Upload className="h-4 w-4" />
              {busy ? "Uploading…" : "Click to upload banner image"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
          )}
          <input
            className="input mt-2"
            placeholder="…or paste image URL"
            value={f.image_url}
            onChange={(e) => setF({ ...f, image_url: e.target.value })}
          />
        </div>
        <Field label="Eyebrow" value={f.eyebrow} onChange={(v) => setF({ ...f, eyebrow: v })} placeholder="Bridal Collection · 2026" />
        <Field label="CTA label" value={f.cta_label} onChange={(v) => setF({ ...f, cta_label: v })} />
        <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} placeholder="Adornments of a lifetime" />
        <Field label="CTA link" value={f.cta_link} onChange={(v) => setF({ ...f, cta_link: v })} placeholder="/products" />
        <div className="sm:col-span-2">
          <Field label="Subtitle" value={f.subtitle} onChange={(v) => setF({ ...f, subtitle: v })} textarea />
        </div>
        <Field label="Show from (optional)" type="datetime-local" value={f.starts_at} onChange={(v) => setF({ ...f, starts_at: v })} />
        <Field label="Show until (optional)" type="datetime-local" value={f.ends_at} onChange={(v) => setF({ ...f, ends_at: v })} />
        <div className="sm:col-span-2">
          <button className="bg-rose-gradient text-primary-foreground rounded-full px-6 py-2.5 text-sm shadow-luxe">
            <Plus className="mr-1 inline h-4 w-4" /> Add banner
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {data.map((b, i) => (
          <div key={b.id} className="flex items-center gap-4 rounded-2xl border bg-background p-3 shadow-soft">
            <img src={b.image_url} alt="" className="h-16 w-28 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{b.title || "(Untitled)"}</div>
              <div className="truncate text-xs text-muted-foreground">
                {b.eyebrow} · {b.cta_label} → {b.cta_link}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-blush disabled:opacity-30" aria-label="Move up">
                <ArrowUp className="h-4 w-4" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === data.length - 1} className="rounded-lg p-2 hover:bg-blush disabled:opacity-30" aria-label="Move down">
                <ArrowDown className="h-4 w-4" />
              </button>
              <button onClick={() => toggle(b.id, b.active)} className={`rounded-lg p-2 ${b.active ? "text-emerald-600" : "text-muted-foreground"}`} aria-label="Toggle active">
                {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              <button onClick={() => del(b.id)} className="rounded-lg p-2 text-ruby hover:bg-ruby/10" aria-label="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="rounded-2xl border bg-background p-8 text-center text-sm text-muted-foreground">No banners yet. Add your first one above.</p>}
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:9999px;padding:.6rem 1.1rem;font-size:.875rem;outline:none}textarea.input{border-radius:1rem;font-family:inherit}`}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {textarea ? (
        <textarea rows={2} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}
