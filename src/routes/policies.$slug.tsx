import { createFileRoute, notFound } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/policies/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("policies")
      .select("slug,title,body,updated_at")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Policy"} — Satyabhama` },
      { name: "description", content: (loaderData?.body ?? "").slice(0, 155) },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl">Unable to load page</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="font-serif text-3xl">Page not found</h1>
    </div>
  ),
  component: Page,
});

function Page() {
  const p = Route.useLoaderData();
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Satyabhama</p>
      <h1 className="mt-2 font-serif text-4xl font-medium">{p.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Last updated {new Date(p.updated_at).toLocaleDateString("en-IN")}
      </p>
      <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal/90">
        {p.body}
      </div>
    </div>
  );
}
