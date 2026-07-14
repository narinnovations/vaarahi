import { useQuery } from "@tanstack/react-query";
import { Instagram, ExternalLink, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/site-settings";

export function InstagramReels() {
  const settings = useSettings();
  const { data: reels = [] } = useQuery({
    queryKey: ["reels", "active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instagram_reels")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return data ?? [];
    },
  });

  if (!settings.reels_section.enabled || reels.length === 0) return null;
  const handle = settings.store.instagram;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <p className="text-xs tracking-[0.3em] uppercase text-primary">
          <Instagram className="mr-1 inline h-3.5 w-3.5" /> @{handle}
        </p>
        <h2 className="mt-2 font-display text-4xl font-medium sm:text-5xl">{settings.reels_section.title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">{settings.reels_section.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {reels.slice(0, 8).map((r) => (
          <a
            key={r.id}
            href={r.reel_url}
            target="_blank"
            rel="noreferrer"
            className="group relative block aspect-[9/16] overflow-hidden rounded-2xl bg-blush shadow-luxe ring-1 ring-border/40 transition hover:-translate-y-1 hover:shadow-xl"
          >
            {r.thumbnail_url ? (
              <img
                src={r.thumbnail_url}
                alt={r.caption || "Instagram reel"}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-rose-gradient text-primary-foreground">
                <Instagram className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
            <div className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-charcoal shadow-soft">
              <Play className="h-4 w-4 fill-current" />
            </div>
            {r.caption && (
              <p className="absolute bottom-3 left-3 right-3 line-clamp-2 text-xs font-medium text-white">
                {r.caption}
              </p>
            )}
          </a>
        ))}
      </div>
      <div className="mt-10 text-center">
        <a
          href={`https://instagram.com/${handle}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-primary px-6 py-2.5 text-sm text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          Visit our Instagram <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}
