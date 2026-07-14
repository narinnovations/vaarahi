import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { logActivity } from "@/lib/log";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  component: NotificationsAdmin,
});

type Channels = { email?: boolean; sms?: boolean; whatsapp?: boolean; push?: boolean };
type Events = {
  new_order?: Channels;
  order_shipped?: Channels;
  order_delivered?: Channels;
  low_stock?: Channels;
  new_customer?: Channels;
  newsletter?: Channels;
};
type NotifSettings = {
  events?: Events;
  smtp?: { host?: string; port?: number; user?: string; from_name?: string; from_email?: string };
  sms?: { provider?: string; sender_id?: string };
  whatsapp?: { provider?: string; phone_id?: string };
  push?: { onesignal_app_id?: string };
};

const EVENT_LIST: { key: keyof Events; label: string; desc: string }[] = [
  { key: "new_order", label: "New order", desc: "When a customer places an order" },
  { key: "order_shipped", label: "Order shipped", desc: "When an order is marked shipped" },
  { key: "order_delivered", label: "Order delivered", desc: "When an order is delivered" },
  { key: "low_stock", label: "Low stock alert", desc: "When product stock falls below threshold" },
  { key: "new_customer", label: "New customer sign-up", desc: "When a new customer registers" },
  { key: "newsletter", label: "Newsletter", desc: "Broadcast to opted-in customers" },
];

function NotificationsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notif-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "notifications").maybeSingle();
      return (data?.value as NotifSettings) ?? {};
    },
  });
  const [state, setState] = useState<NotifSettings>({});
  useEffect(() => { if (data) setState(data); }, [data]);

  const toggle = (event: keyof Events, channel: keyof Channels, val: boolean) => {
    setState((s) => ({ ...s, events: { ...s.events, [event]: { ...s.events?.[event], [channel]: val } } }));
  };

  const save = async () => {
    const { error } = await supabase.from("site_settings").upsert({ key: "notifications", value: state as never }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    await logActivity("update", "site_settings", "notifications");
    toast.success("Notification settings saved");
    qc.invalidateQueries({ queryKey: ["notif-settings"] });
  };

  return (
    <div>
      <AdminPageHeader
        title="Notifications"
        subtitle="Route order and customer events to Email, SMS, WhatsApp and Push."
        actions={<button onClick={save} className="rounded-full bg-rose-gradient px-5 py-2 text-xs text-primary-foreground shadow-soft">Save changes</button>}
      />

      <section className="mb-6 rounded-2xl border bg-background p-5 shadow-soft">
        <h2 className="mb-4 font-display text-base uppercase tracking-widest">Event routing</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="py-2">Event</th>
                <th className="text-center">Email</th>
                <th className="text-center">SMS</th>
                <th className="text-center">WhatsApp</th>
                <th className="text-center">Push</th>
              </tr>
            </thead>
            <tbody>
              {EVENT_LIST.map((e) => (
                <tr key={e.key} className="border-b last:border-0">
                  <td className="py-3">
                    <div className="font-medium">{e.label}</div>
                    <div className="text-xs text-muted-foreground">{e.desc}</div>
                  </td>
                  {(["email", "sms", "whatsapp", "push"] as (keyof Channels)[]).map((c) => (
                    <td key={c} className="text-center">
                      <input type="checkbox" checked={!!state.events?.[e.key]?.[c]} onChange={(ev) => toggle(e.key, c, ev.target.checked)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="SMTP (Email)">
          <Field label="Host" value={state.smtp?.host ?? ""} onChange={(v) => setState({ ...state, smtp: { ...state.smtp, host: v } })} />
          <Field label="Port" value={state.smtp?.port ?? ""} type="number" onChange={(v) => setState({ ...state, smtp: { ...state.smtp, port: Number(v) } })} />
          <Field label="User" value={state.smtp?.user ?? ""} onChange={(v) => setState({ ...state, smtp: { ...state.smtp, user: v } })} />
          <Field label="From name" value={state.smtp?.from_name ?? ""} onChange={(v) => setState({ ...state, smtp: { ...state.smtp, from_name: v } })} />
          <Field label="From email" value={state.smtp?.from_email ?? ""} onChange={(v) => setState({ ...state, smtp: { ...state.smtp, from_email: v } })} />
          <p className="text-xs text-muted-foreground">SMTP password is stored as a secret — add via project secrets.</p>
        </Card>

        <Card title="SMS provider">
          <Field label="Provider (e.g. Twilio, MSG91)" value={state.sms?.provider ?? ""} onChange={(v) => setState({ ...state, sms: { ...state.sms, provider: v } })} />
          <Field label="Sender / DLT ID" value={state.sms?.sender_id ?? ""} onChange={(v) => setState({ ...state, sms: { ...state.sms, sender_id: v } })} />
        </Card>

        <Card title="WhatsApp Business API">
          <Field label="Provider (Meta Cloud API, Gupshup, etc.)" value={state.whatsapp?.provider ?? ""} onChange={(v) => setState({ ...state, whatsapp: { ...state.whatsapp, provider: v } })} />
          <Field label="Phone number ID" value={state.whatsapp?.phone_id ?? ""} onChange={(v) => setState({ ...state, whatsapp: { ...state.whatsapp, phone_id: v } })} />
        </Card>

        <Card title="Push notifications">
          <Field label="OneSignal App ID" value={state.push?.onesignal_app_id ?? ""} onChange={(v) => setState({ ...state, push: { ...state.push, onesignal_app_id: v } })} />
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-background p-5 shadow-soft">
      <h2 className="mb-3 font-display text-base uppercase tracking-widest">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: unknown; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value)} className="w-full rounded-full border bg-background px-4 py-2 text-sm outline-none" />
    </label>
  );
}
