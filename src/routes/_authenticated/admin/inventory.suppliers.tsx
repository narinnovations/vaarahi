import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { logActivity } from "@/lib/log";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export const Route = createFileRoute("/_authenticated/admin/inventory/suppliers")({
  component: Suppliers,
});

function Suppliers() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => (await supabase.from("suppliers").select("*").order("name")).data ?? [],
  });

  const [editing, setEditing] = useState<Partial<Supplier> | null>(null);

  const save = async () => {
    if (!editing?.name) return toast.error("Name required");
    const payload = {
      name: editing.name,
      phone: editing.phone ?? null,
      email: editing.email ?? null,
      address: editing.address ?? null,
      notes: editing.notes ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert(payload);
    if (error) return toast.error(error.message);
    await logActivity(editing.id ? "supplier.update" : "supplier.create", "suppliers", editing.id);
    toast.success("Saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["suppliers"] });
  };

  const del = async (s: Supplier) => {
    if (!confirm(`Delete supplier ${s.name}?`)) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    await logActivity("supplier.delete", "suppliers", s.id);
    qc.invalidateQueries({ queryKey: ["suppliers"] });
  };

  const columns: Column<Supplier>[] = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "email", header: "Email" },
    { key: "address", header: "Address" },
    {
      key: "actions",
      header: "",
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => setEditing(r)} className="rounded-full border p-1.5 hover:bg-blush">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => del(r)} className="rounded-full border p-1.5 text-ruby hover:bg-ruby/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Suppliers"
        subtitle="Manage vendors you purchase inventory from."
        actions={
          <button
            onClick={() => setEditing({})}
            className="rounded-full bg-rose-gradient px-4 py-2 text-xs text-primary-foreground shadow-luxe"
          >
            + New supplier
          </button>
        }
      />

      <DataTable rows={data ?? []} columns={columns} exportName="suppliers" />

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal/50 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-2xl border bg-background p-5 shadow-luxe" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 font-display text-lg uppercase tracking-widest">{editing.id ? "Edit" : "New"} supplier</h2>
            <div className="space-y-3">
              {[
                ["name", "Name"],
                ["phone", "Phone"],
                ["email", "Email"],
                ["address", "Address"],
                ["notes", "Notes"],
              ].map(([k, l]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{l}</span>
                  {k === "address" || k === "notes" ? (
                    <textarea
                      rows={2}
                      value={(editing as Record<string, string>)[k] ?? ""}
                      onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                      className="w-full rounded-2xl border bg-background px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      value={(editing as Record<string, string>)[k] ?? ""}
                      onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                      className="w-full rounded-full border bg-background px-3 py-2 text-sm"
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEditing(null)} className="rounded-full border px-4 py-2 text-xs">Cancel</button>
              <button onClick={save} className="rounded-full bg-rose-gradient px-4 py-2 text-xs text-primary-foreground shadow-luxe">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
