import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import hero1 from "@/assets/hero-jewellery.jpg";
import hero2 from "@/assets/hero-flatlay.jpg";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  image_url: string;
  link_type: string;
  link_value: string;
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
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (error) throw error;

      return data ?? [];
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

        h-[240px]

        sm:h-[380px]

        lg:h-[92vh]
        lg:min-h-[560px]
        lg:max-h-[820px]
      "
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === active
            ? "opacity-100"
            : "pointer-events-none opacity-0"
            }`}
        >
          <Link
            to={
              slide.link_type === "category"
                ? `/categories/${slide.link_value}`
                : slide.link_type === "product"
                  ? `/products/${slide.link_value}`
                  : "/products"
            }
            className="absolute inset-0 z-0"
          >
            <img
              src={slide.image_url}
              alt=""
              fetchPriority={i === 0 ? "high" : "low"}
              className="h-full w-full object-cover object-[35%_center] lg:object-center"
            />
          </Link>


        </div>
      ))
      }

      {
        slides.length > 1 && (
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-8">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
                className={`rounded-full transition-all ${i === active
                  ? "bg-rose-gradient w-8 h-1.5 sm:w-10"
                  : "bg-charcoal/25 w-4 h-1.5 sm:w-5"
                  }`}
              />
            ))}
          </div>
        )
      }
    </section >
  );
}