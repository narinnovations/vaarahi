import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { DateRangePicker, rangeFromPreset, type DatePreset, type DateRange } from "@/components/admin/DateRangePicker";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  component: LogsAdmin,
});

type LogRow = {
  id: string;
  created_at: string;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  ip: string | null;
  metadata: unknown;
};

function LogsAdmin() {
  const [preset, setPreset] = useState<{ preset: DatePreset; custom?: DateRange }>({ preset: "7d" });
  const [action, setAction] = useState("");
  const range = rangeFromPreset(preset.preset, preset.custom);

  const { data } = useQuery({
    queryKey: ["activity-logs", range.start, range.end, action],
    queryFn: async () => {
      let q = supabase.from("activity_logs").select("*").gte("created_at", range.start).lte("created_at", range.end).order("created_at", { ascending: false }).limit(500);
      if (action) q = q.ilike("action", `%${action}%`);
      const { data } = await q;
      return (data ?? []) as unknown as LogRow[];
    },
  });

  return (
    <div>
      <AdminPageHeader title="Activity logs" subtitle="Track admin actions, logins, and CRUD events." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <DateRangePicker value={preset} onChange={setPreset} />
        <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Filter action (login, create, update…)" className="w-72 rounded-full border bg-background px-4 py-2 text-sm" />
      </div>

      <DataTable
        rows={data ?? []}
        columns={[
          { key: "created_at", header: "When", render: (r) => new Date(r.created_at).toLocaleString() },
          { key: "user_email", header: "Actor", render: (r) => r.user_email || "—" },
          { key: "action", header: "Action" },
          { key: "entity", header: "Target", render: (r) => r.entity ? `${r.entity}${r.entity_id ? ` #${String(r.entity_id).slice(0, 8)}` : ""}` : "—" },
          { key: "ip", header: "IP", render: (r) => r.ip || "—" },
          { key: "metadata", header: "Details", sortable: false, render: (r) => r.metadata ? <code className="text-[10px]">{JSON.stringify(r.metadata).slice(0, 60)}</code> : "—" },
        ] as Column<LogRow>[]}
        exportName="activity-logs"
        pageSize={50}
      />
    </div>
  );
}
