import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/promo-banners")({
    component: PromoBannersAdmin,
});

type BannerForm = {
    title: string;
    subtitle: string;
    image_url: string;

    button_text: string;

    coupon_code: string;
    coupon_text: string;

    link_type: string;
    link_value: string;

    is_active: boolean;
};

const empty: BannerForm = {
    title: "",
    subtitle: "",
    image_url: "",

    button_text: "Shop Now",

    coupon_code: "",
    coupon_text: "",

    link_type: "category",
    link_value: "",

    is_active: true,
};

function PromoBannersAdmin() {
    const qc = useQueryClient();
    const { data = [] } = useQuery({
        queryKey: ["admin-promo-banners"],
        queryFn: async () => {
            const { data, error } = await supabase.from("promo_banners").select("*").order("display_order");
            if (error) throw error;
            return data ?? [];
        },
    });
    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("slug,name")
                .order("name");

            if (error) throw error;

            return data ?? [];
        },
    });
    const { data: products = [] } = useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("products")
                .select("slug,name")
                .order("name");

            if (error) throw error;

            return data ?? [];
        },
    });
    const [f, setF] = useState<BannerForm>(empty);
    const [busy, setBusy] = useState(false);

    const upload = async (file: File) => {
        setBusy(true);
        const path = `banners/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
        const { error } = await supabase.storage.from("promo-banners").upload(path, file);
        if (error) {
            toast.error(error.message);
            setBusy(false);
            return;
        }
        const { data: pub } =
            supabase.storage.from("promo-banners").getPublicUrl(path);
        setF((s) => ({ ...s, image_url: pub.publicUrl }));
        setBusy(false);
    };

    const add = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!f.image_url) {
            return toast.error("Please upload a banner image");
        }

        const nextOrder = (data[data.length - 1]?.display_order ?? -1) + 1;

        const { error } = await supabase
            .from("promo_banners")
            .insert({
                title: f.title,
                subtitle: f.subtitle,
                image_url: f.image_url,

                button_text: f.button_text,

                coupon_code: f.coupon_code,
                coupon_text: f.coupon_text,

                link_type: f.link_type,
                link_value: f.link_value,

                display_order: nextOrder,

                is_active: f.is_active,
            });

        if (error) {
            return toast.error(error.message);
        }

        toast.success("Promo card added");

        setF(empty);


    };

    const del = async (id: string) => {
        if (!confirm("Delete this banner?")) return;
        await supabase.from("promo_banners").delete().eq("id", id);
        qc.invalidateQueries({ queryKey: ["admin-promo-banners"] });

    };

    const toggle = async (id: string, active: boolean) => {
        await supabase.from("promo_banners").update({
            is_active: !active,
        }).eq("id", id);
        qc.invalidateQueries({ queryKey: ["admin-promo-banners"] });
    };

    const move = async (idx: number, dir: -1 | 1) => {
        const target = data[idx + dir];
        const cur = data[idx];
        if (!target || !cur) return;
        await Promise.all([
            supabase.from("promo_banners").update({ display_order: target.display_order }).eq("id", cur.id),
            supabase.from("promo_banners").update({ display_order: cur.display_order }).eq("id", target.id),
        ]);
        qc.invalidateQueries({
            queryKey: ["admin-promo-banners"],
        });

    };

    return (
        <div>
            <h1 className="mb-2 font-display text-3xl tracking-[0.12em]">Promo Cards</h1>
            <p className="mb-6 text-sm text-muted-foreground">
                Manage promotional cards displayed between homepage sections.
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

                <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} placeholder="Adornments of a lifetime" />
                <Field
                    label="Button Text"
                    value={f.button_text}
                    onChange={(v) => setF({ ...f, button_text: v })}
                    placeholder="Shop Now"
                />
                <div>
                    <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                        Link Type
                    </label>

                    <select
                        className="input"
                        value={f.link_type}
                        onChange={(e) =>
                            setF({
                                ...f,
                                link_type: e.target.value,
                                link_value: "",
                            })
                        }
                    >
                        <option value="category">Category</option>
                        <option value="product">Product</option>
                        <option value="external">External URL</option>
                    </select>
                </div>
                <div>
                    <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                        Destination
                    </label>

                    {f.link_type === "category" ? (
                        <select
                            className="input"
                            value={f.link_value}
                            onChange={(e) =>
                                setF({
                                    ...f,
                                    link_value: e.target.value,
                                })
                            }
                        >
                            <option value="">Select Category</option>

                            {categories.map((c) => (
                                <option key={c.slug} value={c.slug}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    ) : f.link_type === "product" ? (
                        <select
                            className="input"
                            value={f.link_value}
                            onChange={(e) =>
                                setF({
                                    ...f,
                                    link_value: e.target.value,
                                })
                            }
                        >
                            <option value="">Select Product</option>

                            {products.map((p) => (
                                <option key={p.slug} value={p.slug}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <input
                            className="input"
                            placeholder="https://..."
                            value={f.link_value}
                            onChange={(e) =>
                                setF({
                                    ...f,
                                    link_value: e.target.value,
                                })
                            }
                        />
                    )}
                </div>
                <div className="sm:col-span-2">
                    <Field label="Subtitle" value={f.subtitle} onChange={(v) => setF({ ...f, subtitle: v })} textarea />
                    <Field
                        label="Coupon Code"
                        value={f.coupon_code}
                        onChange={(v) => setF({ ...f, coupon_code: v })}
                        placeholder="VAARAHI20"
                    />

                    <Field
                        label="Coupon Text"
                        value={f.coupon_text}
                        onChange={(v) => setF({ ...f, coupon_text: v })}
                        placeholder="Flat 20% OFF"
                    />
                </div>

                <div className="sm:col-span-2">
                    <div className="sm:col-span-2">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={f.is_active}
                                onChange={(e) =>
                                    setF({
                                        ...f,
                                        is_active: e.target.checked,
                                    })
                                }
                            />
                            <span className="text-sm">Active</span>
                        </label>
                    </div>
                    <button className="bg-rose-gradient text-primary-foreground rounded-full px-6 py-2.5 text-sm shadow-luxe">
                        <Plus className="mr-1 inline h-4 w-4" /> Save Promo Card
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
                                <>
                                    <div>Coupon: {b.coupon_code || "-"}</div>
                                    <div>
                                        {b.link_type} → {b.link_value}
                                    </div>
                                </>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-2 hover:bg-blush disabled:opacity-30" aria-label="Move up">
                                <ArrowUp className="h-4 w-4" />
                            </button>
                            <button onClick={() => move(i, 1)} disabled={i === data.length - 1} className="rounded-lg p-2 hover:bg-blush disabled:opacity-30" aria-label="Move down">
                                <ArrowDown className="h-4 w-4" />
                            </button>
                            <button onClick={() => toggle(b.id, b.is_active)} className={`rounded-lg p-2 ${b.is_active
                                    ? "text-emerald-600"
                                    : "text-muted-foreground"
                                }`} aria-label="Toggle active">
                                {b.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
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
