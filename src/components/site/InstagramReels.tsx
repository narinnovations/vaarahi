import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import {
  Instagram,
  ExternalLink,
  Play,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
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

  const reelsRef = useRef<HTMLDivElement>(null);

  const scrollReels = (dir: "left" | "right") => {
    reelsRef.current?.scrollBy({
      left: dir === "left" ? -350 : 350,
      behavior: "smooth",
    });
  };
  if (!settings.reels_section.enabled || reels.length === 0) return null;
  const handle = settings.store.instagram;

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-primary">
            <Instagram className="mr-1 inline h-3.5 w-3.5" />
            @{handle}
          </p>

          <h2 className="mt-2 font-display text-4xl font-medium sm:text-5xl">
            {settings.reels_section.title}
          </h2>

          <p className="mt-3 max-w-lg text-sm text-muted-foreground">
            {settings.reels_section.subtitle}
          </p>
        </div>

        <div className="hidden gap-2 md:flex">
          <button
            onClick={() => scrollReels("left")}
            className="rounded-full border p-2 hover:bg-blush"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => scrollReels("right")}
            className="rounded-full border p-2 hover:bg-blush"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div
        ref={reelsRef}
        className="flex gap-5 overflow-x-auto scroll-smooth pb-4
             [-ms-overflow-style:none]
             [scrollbar-width:none]
             [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((r) => (
          <div
            key={r.id}
            className="w-[60vw] min-w-[220px] max-w-[280px] flex-shrink-0"
          >
            <a
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
          </div>
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
