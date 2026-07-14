import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";

export type ProductInput = {
  slug: string;
  name: string;
  description: string;
  category_slug: string;
  price: number;
  original_price: number | null;
  stock: number;
  images: string[];
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  tags: string[];
};

export function ProductForm({
  initial,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<ProductInput>;
  onSubmit: (p: ProductInput) => Promise<void>;
  submitLabel: string;
}) {
  const { data: cats } = useQuery({
    queryKey: ["cats-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("slug,name").order("sort_order");
      return data ?? [];
    },
  });

  const [f, setF] = useState<ProductInput>({
    slug: "",
    name: "",
    description: "",
    category_slug: "",
    price: 0,
    original_price: null,
    stock: 0,
    images: [],
    is_new: false,
    is_bestseller: false,
    is_featured: false,
    tags: [],
    ...initial,
  });
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (initial) setF((prev) => ({ ...prev, ...initial }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.slug]);

  const set = <K extends keyof ProductInput>(k: K, v: ProductInput[K]) =>
    setF((s) => ({ ...s, [k]: v }));

  const autoSlug = () => {
    if (f.slug || !f.name) return;
    set(
      "slug",
      f.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  };

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      set("images", [...f.images, ...uploaded]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    set("images", [...f.images, url]);
    setUrlInput("");
  };

  const removeImage = (i: number) => set("images", f.images.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.slug || !f.name || !f.category_slug || f.price <= 0) {
      toast.error("Please fill name, slug, category and price");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(f);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || f.tags.includes(t)) return;
    set("tags", [...f.tags, t]);
    setTagInput("");
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Basic Info">
          <Field label="Product name">
            <input
              className="input"
              value={f.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={autoSlug}
              required
            />
          </Field>
          <Field label="Slug (URL)" help="Auto-generated from name; edit if needed">
            <input
              className="input"
              value={f.slug}
              onChange={(e) => set("slug", e.target.value)}
              required
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={4}
              className="input min-h-24 rounded-2xl"
              value={f.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
          <Field label="Category">
            <select
              className="input"
              value={f.category_slug}
              onChange={(e) => set("category_slug", e.target.value)}
              required
            >
              <option value="">Select category</option>
              {cats?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </Card>

        <Card title="Images">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="cursor-pointer rounded-2xl border-2 border-dashed border-border p-6 text-center hover:border-primary hover:bg-blush/30">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => upload(e.target.files)}
              />
              {uploading ? (
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              ) : (
                <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
              )}
              <div className="mt-2 text-sm font-medium">Upload from device</div>
              <div className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 20 MB</div>
            </label>
            <div className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <LinkIcon className="h-4 w-4" /> Add image URL
              </div>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={addUrl}
                  className="rounded-full bg-charcoal px-4 py-2 text-xs text-pearl"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          {f.images.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {f.images.map((src, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border">
                  <img src={resolveImage(src)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-charcoal/80 px-1.5 py-0.5 text-[10px] text-pearl">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Pricing & Stock">
          <Field label="Selling price (₹)">
            <input
              type="number"
              min={0}
              step={1}
              className="input"
              value={f.price}
              onChange={(e) => set("price", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Original price (₹)" help="Shown as strikethrough for discount">
            <input
              type="number"
              min={0}
              step={1}
              className="input"
              value={f.original_price ?? ""}
              onChange={(e) =>
                set("original_price", e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          {f.original_price && f.original_price > f.price && (
            <p className="text-xs text-emerald-700">
              {Math.round(((f.original_price - f.price) / f.original_price) * 100)}% off
            </p>
          )}
          <Field label="Stock quantity">
            <input
              type="number"
              min={0}
              className="input"
              value={f.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
            />
          </Field>
        </Card>

        <Card title="Tags & Badges">
          <div className="flex gap-2">
            <input
              className="input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="Add a tag"
            />
            <button
              type="button"
              onClick={addTag}
              className="rounded-full bg-charcoal px-3 py-2 text-xs text-pearl"
            >
              Add
            </button>
          </div>
          {f.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {f.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => set("tags", f.tags.filter((x) => x !== t))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="space-y-2 pt-2">
            {(
              [
                ["is_new", "Mark as New"],
                ["is_bestseller", "Bestseller"],
                ["is_featured", "Featured"],
              ] as const
            ).map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={f[k]}
                  onChange={(e) => set(k, e.target.checked)}
                  className="accent-primary"
                />
                {l}
              </label>
            ))}
          </div>
        </Card>

        <button
          type="submit"
          disabled={saving}
          className="bg-rose-gradient text-primary-foreground w-full rounded-full py-3.5 text-sm tracking-wider uppercase shadow-luxe disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>

      <style>{`
        .input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:9999px;padding:.7rem 1.1rem;font-size:.875rem;outline:none;transition:border-color .2s,box-shadow .2s}
        textarea.input{border-radius:1rem}
        .input:focus{border-color:var(--color-primary);box-shadow:0 0 0 3px oklch(.7 .09 30 / .15)}
      `}</style>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-background p-5 shadow-soft">
      <h2 className="mb-4 font-serif text-lg">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium tracking-wider text-charcoal/70 uppercase">
        {label}
      </span>
      {children}
      {help && <span className="mt-1 block text-[11px] text-muted-foreground">{help}</span>}
    </label>
  );
}
