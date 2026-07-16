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
        (b) =>
          (!b.starts_at || b.starts_at <= now) &&
          (!b.ends_at || b.ends_at >= now)
      ) as unknown as Banner[];
    },
  });

  const slides = data && data.length > 0 ? data : fallbackSlides;

  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const id = setInterval(() => {
      setActive((a) => (a + 1) % slides.length);
    }, 6000);

    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <section
      className="
        relative
        overflow-hidden

        h-[52vh]
        min-h-[320px]
        max-h-[500px]

        sm:h-[60vh]
        sm:min-h-[420px]

        lg:h-[92vh]
        lg:min-h-[560px]
        lg:max-h-[820px]
      "
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === active
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <img
            src={slide.image_url}
            alt=""
            fetchPriority={i === 0 ? "high" : "low"}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-5 sm:px-8 lg:px-10">
            <div
              className={`max-w-xl ${
                i === active ? "animate-fade-up" : ""
              }`}
            >
              {slide.eyebrow && (
                <span
                  className="
                    inline-block
                    rounded-full
                    border
                    border-rose-gold/40
                    bg-background/60
                    backdrop-blur

                    px-3
                    py-1

                    text-[8px]
                    tracking-[0.25em]

                    sm:px-4
                    sm:py-1.5
                    sm:text-[10px]

                    uppercase
                    text-primary
                  "
                >
                  {slide.eyebrow}
                </span>
              )}

              <h1
                className="
                  mt-4

                  whitespace-pre-line

                  font-serif
                  font-medium
                  leading-tight
                  text-charcoal

                  text-3xl

                  sm:text-5xl

                  lg:text-7xl
                "
              >
                {slide.title}
              </h1>

              {slide.subtitle && (
                <p
                  className="
                    mt-3

                    max-w-md

                    text-sm
                    leading-relaxed
                    text-charcoal/75

                    sm:mt-5
                    sm:text-base
                  "
                >
                  {slide.subtitle}
                </p>
              )}

              <div className="mt-5 sm:mt-8">
                <Link
                  to={slide.cta_link || "/products"}
                  className="
                    bg-rose-gradient
                    text-primary-foreground

                    inline-flex
                    items-center
                    gap-2

                    rounded-full

                    px-5
                    py-2.5

                    text-xs
                    font-medium

                    shadow-luxe
                    transition
                    hover:scale-[1.02]

                    sm:px-7
                    sm:py-3.5
                    sm:text-sm
                  "
                >
                  {slide.cta_label || "Shop Now"}

                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all ${
                i === active
                  ? "bg-rose-gradient w-8 h-1.5 sm:w-10"
                  : "bg-charcoal/25 w-4 h-1.5 sm:w-5"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}