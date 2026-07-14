import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import hero1 from "@/assets/hero-jewellery.jpg";
import hero2 from "@/assets/hero-flatlay.jpg";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  cta_label: string;
  cta_link: string;
};

const fallbackSlides: Banner[] = [
  {
    id: "f1",
    image_url: hero1,
    eyebrow: "Bridal Collection · 2026",
    title: "Adornments\nof a lifetime",
    subtitle:
      "Handcrafted kundan, ruby & pearl heirlooms — designed to be worn today and passed on tomorrow.",
    cta_label: "Shop the Edit",
    cta_link: "/products",
  },
  {
    id: "f2",
    image_url: hero2,
    eyebrow: "New · Rose Gold Season",
    title: "Soft luxury,\nquietly powerful.",
    subtitle:
      "Rose-gold accessories, pearl-chain clutches and pink diamond rings for your everyday elevated.",
    cta_label: "Shop Handbags",
    cta_link: "/products",
  },
];

export function HeroSlider() {
  const { data } = useQuery({
    queryKey: ["banners", "active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("active", true)
        .order("sort_order", { ascending: true });
      return (data ?? []).filter(
        (b) => (!b.starts_at || b.starts_at <= now) && (!b.ends_at || b.ends_at >= now),
      ) as unknown as Banner[];
    },
  });

  const slides = data && data.length > 0 ? data : fallbackSlides;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => setActive((a) => (a + 1) % slides.length), 6000);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section className="relative h-[92vh] max-h-[820px] min-h-[560px] overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === active ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <img
            src={slide.image_url}
            alt=""
            className="h-full w-full object-cover"
            fetchPriority={i === 0 ? "high" : "low"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 sm:px-10">
            <div className={`max-w-xl ${i === active ? "animate-fade-up" : ""}`}>
              {slide.eyebrow && (
                <span className="inline-block rounded-full border border-rose-gold/40 bg-background/50 px-4 py-1.5 text-[10px] tracking-[0.3em] text-primary uppercase backdrop-blur">
                  {slide.eyebrow}
                </span>
              )}
              <h1 className="mt-6 font-serif text-5xl leading-[1.05] font-medium whitespace-pre-line text-charcoal sm:text-6xl md:text-7xl">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-5 max-w-md text-base leading-relaxed text-charcoal/75">
                  {slide.subtitle}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to={slide.cta_link || "/products"}
                  className="bg-rose-gradient text-primary-foreground group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium tracking-wide shadow-luxe transition hover:scale-[1.02]"
                >
                  {slide.cta_label || "Shop Now"}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active ? "bg-rose-gradient w-10" : "w-5 bg-charcoal/25"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
