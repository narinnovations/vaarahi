import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import type { Database } from "@/integrations/supabase/types";
import { logActivity } from "@/lib/log";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersAdmin,
});

type Role = Database["public"]["Enums"]["app_role"];
const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: "super_admin", label: "Super Admin", desc: "Full access, can manage other admins" },
  { value: "admin", label: "Admin", desc: "Manage everything except admin users" },
  { value: "manager", label: "Manager", desc: "Products, orders, inventory" },
  { value: "staff", label: "Staff", desc: "Fulfill orders, update stock" },
  { value: "readonly", label: "Read Only", desc: "View reports and data only" },
  { value: "customer", label: "Customer", desc: "Regular shopper" },
];

type Row = { id: string; email: string; full_name: string | null; blocked: boolean | null; roles: Role[] };

function UsersAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, blocked"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const rmap = new Map<string, Role[]>();
      for (const r of roles ?? []) {
        const arr = rmap.get(r.user_id) ?? [];
        arr.push(r.role);
        rmap.set(r.user_id, arr);
      }
      const rows: Row[] = (profiles ?? []).map((p) => ({
        id: p.id,
        email: p.email ?? "",
        full_name: p.full_name,
        blocked: p.blocked,
        roles: rmap.get(p.id) ?? [],
      }));
      return rows.filter((r) => r.roles.some((role) => role !== "customer"));
    },
  });

  const setRole = async (user_id: string, role: Role, add: boolean) => {
    if (add) {
      const { error } = await supabase.from("user_roles").insert({ user_id, role } as never);
      if (error) return toast.error(error.message);
      await logActivity("grant_role", "user_roles", user_id, { role });
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) return toast.error(error.message);
      await logActivity("revoke_role", "user_roles", user_id, { role });
    }
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const toggleBlock = async (r: Row) => {
    const { error } = await supabase.from("profiles").update({ blocked: !r.blocked }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await logActivity(r.blocked ? "unblock" : "block", "profiles", r.id);
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const rows = (data ?? []).filter((r) => !q || r.email.toLowerCase().includes(q.toLowerCase()) || (r.full_name ?? "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <AdminPageHeader title="Admin users & roles" subtitle="Grant super admin, admin, manager, staff or read-only access." />

      <div className="mb-4 flex items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search admins…" className="w-72 rounded-full border bg-background px-4 py-2 text-sm" />
      </div>

      <section className="mb-6 rounded-2xl border bg-background p-5 shadow-soft">
        <DataTable
          rows={rows}
          columns={[
            { key: "email", header: "Email" },
            { key: "full_name", header: "Name", render: (r) => r.full_name || "—" },
            { key: "roles", header: "Roles", sortable: false, render: (r) => (
              <div className="flex flex-wrap gap-1">
                {ROLES.filter((x) => x.value !== "customer").map((role) => {
                  const has = r.roles.includes(role.value);
                  return (
                    <button key={role.value} onClick={() => setRole(r.id, role.value, !has)} className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${has ? "border-ruby bg-ruby text-ivory" : "hover:bg-blush"}`}>
                      {role.label}
                    </button>
                  );
                })}
              </div>
            ) },
            { key: "blocked", header: "Status", render: (r) => r.blocked ? <span className="text-ruby text-xs">Blocked</span> : <span className="text-xs text-emerald-700">Active</span> },
            { key: "actions", header: "", sortable: false, render: (r) => (
              <button onClick={() => toggleBlock(r)} className="rounded-full border px-3 py-1 text-xs">{r.blocked ? "Unblock" : "Block"}</button>
            ) },
          ] as Column<Row>[]}
          exportName="admin-users"
        />
      </section>

      <section className="rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-3 font-display text-base uppercase tracking-widest">Role reference</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <div key={r.value} className="rounded-xl border p-3">
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">To promote a new admin: they must sign up first via the storefront, then assign a role here.</p>
      </section>
    </div>
  );
}
