import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/policies")({
  component: PoliciesAdmin,
});

function PoliciesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-policies"],
    queryFn: async () => {
      const { data } = await supabase.from("policies").select("*").order("slug");
      return data ?? [];
    },
  });

  const [selected, setSelected] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!selected && data && data[0]) setSelected(data[0].slug);
  }, [data, selected]);

  useEffect(() => {
    const p = data?.find((x) => x.slug === selected);
    if (p) {
      setTitle(p.title);
      setBody(p.body);
    }
  }, [selected, data]);

  const save = async () => {
    if (!selected) return;
    const { error } = await supabase.from("policies").update({ title, body }).eq("slug", selected);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["admin-policies"] });
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-medium">Policies & Pages</h1>
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border bg-background p-2 shadow-soft">
          {data?.map((p) => (
            <button
              key={p.slug}
              onClick={() => setSelected(p.slug)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${selected === p.slug ? "bg-rose-gradient text-primary-foreground" : "hover:bg-blush"}`}
            >
              {p.title}
            </button>
          ))}
        </aside>
        <section className="rounded-2xl border bg-background p-5 shadow-soft">
          <label className="mb-3 block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="mb-4 block">
            <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">Content</span>
            <textarea
              className="input min-h-[380px] rounded-2xl"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <button
            onClick={save}
            className="bg-rose-gradient text-primary-foreground rounded-full px-6 py-2.5 text-sm shadow-luxe"
          >
            Save changes
          </button>
        </section>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-border);background:var(--color-background);border-radius:9999px;padding:.65rem 1.1rem;font-size:.875rem;outline:none}textarea.input{border-radius:1rem;font-family:inherit}`}</style>
    </div>
  );
}
