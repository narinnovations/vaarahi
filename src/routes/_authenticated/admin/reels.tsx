import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Upload, Instagram } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/reels")({
  component: ReelsAdmin,
});

function ReelsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-reels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("instagram_reels").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [reel_url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [thumbnail_url, setThumb] = useState("");
  const [busy, setBusy] = useState(false);

  const uploadThumb = async (file: File) => {
    setBusy(true);
    const path = `reels/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    setThumb(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    setBusy(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reel_url) return toast.error("Paste an Instagram reel URL");
    const nextOrder = (data[data.length - 1]?.sort_order ?? -1) + 1;
    const { error } = await supabase.from("instagram_reels").insert({
      reel_url,
      caption,
      thumbnail_url: thumbnail_url || null,
      sort_order: nextOrder,
    });
    if (error) return toast.error(error.message);
    toast.success("Reel added");
    setUrl("");
    setCaption("");
    setThumb("");
    qc.invalidateQueries({ queryKey: ["admin-reels"] });
    qc.invalidateQueries({ queryKey: ["reels", "active"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this reel?")) return;
    await supabase.from("instagram_reels").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reels"] });
    qc.invalidateQueries({ queryKey: ["reels", "active"] });
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("instagram_reels").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reels"] });
    qc.invalidateQueries({ queryKey: ["reels", "active"] });
  };
  const move = async (idx: number, dir: -1 | 1) => {
    const target = data[idx + dir];
    const cur = data[idx];
    if (!target || !cur) return;
    await Promise.all([
      supabase.from("instagram_reels").update({ sort_order: target.sort_order }).eq("id", cur.id),
      supabase.from("instagram_reels").update({ sort_order: cur.sort_order }).eq("id", target.id),
    ]);
    qc.invalidateQueries({ queryKey: ["admin-reels"] });
    qc.invalidateQueries({ queryKey: ["reels", "active"] });
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl tracking-[0.12em]">Instagram Reels</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Add up to 8 reels — they appear in a premium grid on the homepage. Enable/disable the section under Store Settings.
      </p>

      <form onSubmit={add} className="mb-8 grid gap-3 rounded-2xl border bg-background p-5 shadow-soft">
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Instagram reel URL</span>
          <input
            className="input"
            placeholder="https://www.instagram.com/reel/..."
            value={reel_url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Caption (optional)</span>
          <input className="input" placeholder="New rose-gold arrivals ✨" value={caption} onChange={(e) => setCaption(e.target.value)} />
        </label>
        <div>
          <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Thumbnail</span>
          {thumbnail_url ? (
            <div className="relative overflow-hidden rounded-xl border">
              <img src={thumbnail_url} alt="" className="h-40 w-40 object-cover" />
              <button type="button" onClick={() => setThumb("")} className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs">Change</button>
            </div>
          ) : (
            <label className="flex h-24 w-40 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-blush/30 text-xs text-muted-foreground hover:border-primary">
              <Upload className="h-4 w-4" />
              {busy ? "Uploading…" : "Upload thumbnail"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadThumb(e.target.files[0])} />
            </label>
          )}
          <input className="input mt-2" placeholder="…or paste thumbnail URL" value={thumbnail_url} onChange={(e) => setThumb(e.target.value)} />
        </div>
        <button className="bg-rose-gradient text-primary-foreground w-fit rounded-full px-6 py-2.5 text-sm shadow-luxe">
          <Plus className="mr-1 inline h-4 w-4" /> Add reel
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {data.map((r, i) => (
          <div key={r.id} className="flex items-center gap-3 rounded-2xl border bg-background p-3 shadow-soft">
            {r.thumbnail_url ? (
              <img src={r.thumbnail_url} alt="" className="h-16 w-12 rounded-lg object-cover" />
            ) : (
              <div className="grid h-16 w-12 place-items-center rounded-lg bg-rose-gradient text-primary-foreground">
                <Instagram className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{r.caption || "(No caption)"}</div>
              <a href={r.reel_url} target="_blank" rel="noreferrer" className="block truncate text-xs text-primary hover:underline">{r.reel_url}</a>
            </div>
            <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-blush disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
            <button onClick={() => move(i, 1)} disabled={i === data.length - 1} className="rounded-lg p-2 hover:bg-blush disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
            <button onClick={() => toggle(r.id, r.active)} className={`rounded-lg p-2 ${r.active ? "text-emerald-600" : "text-muted-foreground"}`}>{r.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
            <button onClick={() => del(r.id)} className="rounded-lg p-2 text-ruby hover:bg-ruby/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {data.length === 0 && <p className="rounded-2xl border bg-background p-8 text-center text-sm text-muted-foreground sm:col-span-2">No reels yet.</p>}
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:9999px;padding:.6rem 1.1rem;font-size:.875rem;outline:none}`}</style>
    </div>
  );
}
