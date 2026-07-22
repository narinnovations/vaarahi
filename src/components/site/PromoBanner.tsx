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
        <section className="mx-auto max-w-7xl px-4 pt-8">
            <div
                ref={emblaRef}
                className="
        overflow-hidden
        rounded-3xl

        h-[240px]

        sm:h-[380px]

        lg:h-[92vh]
        lg:min-h-[560px]
        lg:max-h-[820px]
    "
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
                                        className="h-full w-full object-cover"
                                    />
                                </a>
                            ) : (
                                <Link to={getLink(card)}>
                                    <img
                                        src={card.image_url}
                                        alt={card.title}
                                        loading="eager"
                                        className="h-full w-full object-cover"
                                    />
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-5 flex justify-center">



                <div className="flex gap-2">
                    {promoCards.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => emblaApi?.scrollTo(index)}
                            className={`rounded-full transition-all ${selected === index
                                    ? "bg-rose-gradient w-8 h-1.5 sm:w-10"
                                    : "bg-charcoal/25 w-4 h-1.5 sm:w-5"
                                }`}
                        />
                    ))}
                </div>



            </div>
        </section>
    );
}