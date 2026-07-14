import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: CouponsAdmin,
});

function CouponsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [f, setF] = useState({
    code: "",
    discount_type: "percent",
    discount_value: 10,
    min_order: 0,
    active: true,
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("coupons").insert({ ...f, code: f.code.toUpperCase() });
    if (error) return toast.error(error.message);
    toast.success("Coupon created");
    setF({ code: "", discount_type: "percent", discount_value: 10, min_order: 0, active: true });
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-medium">Discount Coupons</h1>

      <form onSubmit={add} className="mb-6 grid gap-3 rounded-2xl border bg-background p-5 shadow-soft sm:grid-cols-5">
        <input className="input" placeholder="CODE" required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <select className="input" value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })}>
          <option value="percent">% Off</option>
          <option value="flat">Flat ₹</option>
        </select>
        <input className="input" type="number" min={0} placeholder="Value" required value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: Number(e.target.value) })} />
        <input className="input" type="number" min={0} placeholder="Min order ₹" value={f.min_order} onChange={(e) => setF({ ...f, min_order: Number(e.target.value) })} />
        <button className="bg-rose-gradient text-primary-foreground rounded-full py-2 text-sm">
          <Plus className="mr-1 inline h-4 w-4" /> Add
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border bg-background shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b bg-blush/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Min order</th><th className="p-4">Active</th><th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {data?.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-4 font-mono font-medium">{c.code}</td>
                <td className="p-4">{c.discount_type === "percent" ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
                <td className="p-4">₹{c.min_order}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggle(c.id, c.active)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${c.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => del(c.id)} className="rounded-lg p-2 text-ruby hover:bg-ruby/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:9999px;padding:.55rem 1rem;font-size:.875rem;outline:none}`}</style>
    </div>
  );
}
