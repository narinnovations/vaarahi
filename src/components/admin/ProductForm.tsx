import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/images";

type ProductVariant = {
  id?: string;

  color: string;
  size: string;
  weight: string;
  material: string;
  purity: string;
  finish: string;
  occasion: string;
  style: string;

  sku: string;

  price: number | null;

  stock: number;

  images: string[];
};
export type ProductInput = {
  slug: string;
  name: string;
  description: string;
  category_slug: string;
  price: number;
  original_price: number | null;
  stock: number;
  rating: number;
  review_count: number;
  images: string[];
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  tags: string[];
  gst_enabled: boolean;
  gst_rate: number;
  variants: ProductVariant[];
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
    rating: 4.5,
    review_count: 0,
    images: [],
    tags: [],

    gst_enabled: true,
    gst_rate: 3,

    is_new: false,
    is_bestseller: false,
    is_featured: false,
    variants: [],
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
  const addVariant = () => {
    set("variants", [
      ...f.variants,
      {
        color: "",
        size: "",
        weight: "",
        material: "",
        purity: "",
        finish: "",
        occasion: "",
        style: "",
        sku: "",
        price: null,
        stock: 0,
        images: [],
      },
    ]);
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const updated = [...f.variants];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    set("variants", updated);
  };

  const removeVariant = (index: number) => {
    set(
      "variants",
      f.variants.filter((_, i) => i !== index)
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
      console.log("Submitting product:", f);
      console.log("Variants:", f.variants); X
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
          <Field label="Product Rating">
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              className="input"
              value={f.rating}
              onChange={(e) => set("rating", Number(e.target.value))}
            />
          </Field>

          <Field label="Review Count">
            <input
              type="number"
              min={0}
              className="input"
              value={f.review_count}
              onChange={(e) => set("review_count", Number(e.target.value))}
            />
          </Field>
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
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">GST</h3>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="gst_enabled"
                checked={f.gst_enabled}
                onChange={(e) => set("gst_enabled", e.target.checked)}
              />

              <label htmlFor="gst_enabled">
                Apply GST
              </label>
            </div>

            {f.gst_enabled && (
              <div>
                <label className="block text-sm mb-1">
                  GST Rate
                </label>

                <select
                  value={f.gst_rate}
                  onChange={(e) => set("gst_rate", Number(e.target.value))}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value={0}>0%</option>
                  <option value={3}>3%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            )}
          </div>
        </Card>
        <Card title="Product Variants">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Variants</h3>

            <button
              type="button"
              onClick={addVariant}
              className="rounded-md bg-primary px-4 py-2 text-white"
            >
              + Add Variant
            </button>
          </div>

          {f.variants.map((variant, index) => (
            <div
              key={index}
              className="rounded-lg border p-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">

                <input
                  className="input"
                  placeholder="Color"
                  value={variant.color}
                  onChange={(e) =>
                    updateVariant(index, "color", e.target.value)
                  }
                />

                <input
                  placeholder="Size"
                  value={variant.size}
                  onChange={(e) =>
                    updateVariant(index, "size", e.target.value)
                  }
                />

                <input
                  placeholder="Weight"
                  value={variant.weight}
                  onChange={(e) =>
                    updateVariant(index, "weight", e.target.value)
                  }
                />

                <input
                  placeholder="Material"
                  value={variant.material}
                  onChange={(e) =>
                    updateVariant(index, "material", e.target.value)
                  }
                />

                <input
                  placeholder="Purity"
                  value={variant.purity}
                  onChange={(e) =>
                    updateVariant(index, "purity", e.target.value)
                  }
                />

                <input
                  placeholder="Finish"
                  value={variant.finish}
                  onChange={(e) =>
                    updateVariant(index, "finish", e.target.value)
                  }
                />

                <input
                  placeholder="Occasion"
                  value={variant.occasion}
                  onChange={(e) =>
                    updateVariant(index, "occasion", e.target.value)
                  }
                />

                <input
                  placeholder="Style"
                  value={variant.style}
                  onChange={(e) =>
                    updateVariant(index, "style", e.target.value)
                  }
                />

                <input
                  placeholder="SKU"
                  value={variant.sku}
                  onChange={(e) =>
                    updateVariant(index, "sku", e.target.value)
                  }
                />

                <input
                  type="number"
                  placeholder="Stock"
                  value={variant.stock}
                  onChange={(e) =>
                    updateVariant(index, "stock", Number(e.target.value))
                  }
                />

                <input
                  type="number"
                  placeholder="Price Override"
                  value={variant.price ?? ""}
                  onChange={(e) =>
                    updateVariant(
                      index,
                      "price",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                />

              </div>

              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-red-600"
              >
                Remove Variant
              </button>
            </div>
          ))}
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
