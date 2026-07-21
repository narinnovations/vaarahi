import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useState } from "react";

export default function PromoBanner() {
    const { data: promoCards = [] } = useQuery({
        queryKey: ["promo-cards"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("promo_banners")
                .select("*")
                .eq("is_active", true)
                .order("display_order")
                .limit(2);

            if (error) throw error;

            return data ?? [];
        },
    });
    const getLink = (card: any) => {
        switch (card.link_type) {
            case "category":
                return `/products?category=${card.link_value}`;

            case "product":
                return `/products/${card.link_value}`;

            case "external":
                return card.link_value;

            default:
                return "/products";
        }
    };
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true },
        [Autoplay({ delay: 5000, stopOnInteraction: false })]
    );
    const [selected, setSelected] = useState(0);

    useEffect(() => {
        if (!emblaApi) return;

        const onSelect = () => {
            setSelected(emblaApi.selectedScrollSnap());
        };

        onSelect();
        emblaApi.on("select", onSelect);

        return () => {
            emblaApi.off("select", onSelect);
        };
    }, [emblaApi]);
    return (
        <section className="mx-auto max-w-7xl px-4 py-8">
            <div
                className="overflow-hidden rounded-3xl"
                ref={emblaRef}
            >
                <div className="flex">
                    {promoCards.map((card) => (
                        <div
                            key={card.id}
                            className="min-w-0 flex-[0_0_100%]"
                        >
                            {card.link_type === "external" ? (
                                <a
                                    href={getLink(card)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={card.image_url}
                                        alt={card.title}
                                        className="w-full h-[420px] md:h-[500px] object-cover"
                                    />
                                </a>
                            ) : (
                                <Link to={getLink(card)}>
                                    <img
                                        src={card.image_url}
                                        alt={card.title}
                                        loading="eager"
                                        className="w-full aspect-[16/6] object-cover"
                                    />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">

                <button
                    onClick={() => emblaApi?.scrollPrev()}
                    className="rounded-full border bg-white px-4 py-2 shadow"
                >
                    ←
                </button>

                <div className="flex gap-2">
                    {promoCards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => emblaApi?.scrollTo(index)}
                            className={`h-3 w-3 rounded-full ${selected === index
                                ? "bg-primary"
                                : "bg-gray-300"
                                }`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => emblaApi?.scrollNext()}
                    className="rounded-full border bg-white px-4 py-2 shadow"
                >
                    →
                </button>

            </div>
        </section>
    );
}