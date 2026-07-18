import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeroSlider } from "@/components/site/HeroSlider";
import { CategoryStrip } from "@/components/site/CategoryStrip";
import { ProductCard } from "@/components/site/ProductCard";
import { InstagramReels } from "@/components/site/InstagramReels";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Award,
  Gem,
  Sparkles,
  Truck,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: featured = [] } = useQuery(
    productsQuery({ featured: true })
  );
  const { data: bestsellers = [] } = useQuery(productsQuery({ bestseller: true, limit: 4 }));
  const bestSellerRef = useRef<HTMLDivElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  const scrollFeatured = (dir: "left" | "right") => {
    featuredRef.current?.scrollBy({
      left: dir === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  const scrollBestSeller = (dir: "left" | "right") => {
    bestSellerRef.current?.scrollBy({
      left: dir === "left" ? -420 : 420,
      behavior: "smooth",
    });
  };

  return (
    <div>
      <CategoryStrip categories={categories} />

      <HeroSlider />

      {/* Trust strip */}
      <section className="border-b border-border/60 bg-blush/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:grid-cols-4 sm:gap-6 sm:px-6 sm:py-10">
          {[
            { Icon: Gem, title: "Handcrafted", copy: "In small batches" },
            { Icon: Award, title: "BIS Hallmark", copy: "Where applicable" },
            { Icon: Truck, title: "Free Shipping", copy: "Orders above ₹999" },
            { Icon: Sparkles, title: "Easy Returns", copy: "7-day happiness" },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="bg-rose-gradient text-primary-foreground grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-soft sm:h-11 sm:w-11">
                <t.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-serif text-base leading-tight font-medium sm:text-lg">{t.title}</div>
                <div className="text-[11px] text-muted-foreground sm:text-xs">{t.copy}</div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between sm:mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Featured Edit</p>
            <h2 className="mt-2 font-serif text-3xl font-medium sm:text-5xl">
              The Season's Loveliest
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="hidden items-center gap-1 text-sm text-primary hover:underline sm:inline-flex"
            >
              Shop all <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={() => scrollFeatured("left")}
              className="hidden rounded-full border p-2 hover:bg-blush md:block"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              onClick={() => scrollFeatured("right")}
              className="hidden rounded-full border p-2 hover:bg-blush md:block"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div
          ref={featuredRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4
             [-ms-overflow-style:none]
             [scrollbar-width:none]
             [&::-webkit-scrollbar]:hidden"
        >
          {featured.map((p) => (
            <div
              key={p.id}
              className="w-[45vw] min-w-[170px] max-w-[280px] flex-shrink-0"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="mx-auto my-10 max-w-7xl px-4 sm:my-20 sm:px-6 lg:px-8">
        <div className="bg-rose-gradient text-primary-foreground relative overflow-hidden rounded-2xl px-5 py-10 shadow-luxe sm:rounded-3xl sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-champagne/40 blur-3xl" />
          <div className="relative max-w-xl">
            <p className="text-[10px] tracking-[0.35em] uppercase opacity-80">Limited Edition</p>
            <h3 className="mt-4 font-serif text-3xl leading-tight font-medium sm:text-5xl">
              The Bridal Heirloom Collection
            </h3>
            <p className="mt-3 text-sm opacity-90 sm:mt-4 sm:text-base">
              Kundan, uncut polki and rose-gold pieces — designed to be the star of your
              once-in-a-lifetime moment.
            </p>
            <Link
              to="/products"
              search={{ category: "necklaces" }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium tracking-wide text-primary shadow-luxe transition hover:scale-[1.02]"
            >
              Explore Collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">
              Most Loved
            </p>

            <h2 className="mt-2 font-serif text-3xl font-medium sm:text-5xl">
              Bestsellers
            </h2>

            <p className="mt-3 max-w-lg text-sm text-muted-foreground">
              Pieces our customers keep coming back for.
            </p>
          </div>

          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scrollBestSeller("left")}
              className="rounded-full border p-2 transition hover:bg-blush"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <button
              onClick={() => scrollBestSeller("right")}
              className="rounded-full border p-2 transition hover:bg-blush"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          ref={bestSellerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {bestsellers.map((p) => (
            <div
              key={p.id}
              className="w-[45vw] min-w-[170px] max-w-[280px] flex-shrink-0"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-blush-gradient py-12 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center sm:mb-12">
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Kind Words</p>
            <h2 className="mt-2 font-serif text-3xl font-medium sm:text-5xl">From Our Sisterhood</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Anaya R.",
                text: "The kundan necklace is a heirloom-quality piece. Wore it for my sister's wedding and got compliments all night!",
              },
              {
                name: "Priya M.",
                text: "The packaging alone felt like a gift. Ordered again the same week.",
              },
              {
                name: "Sneha K.",
                text: "Beautiful jhumkas, feather-light. Fast shipping and lovely handwritten note.",
              },
            ].map((r) => (
              <div
                key={r.name}
                className="rounded-xl border border-border/60 bg-background p-4 shadow-soft sm:rounded-2xl sm:p-6"
              >
                <div className="text-champagne mb-3 text-lg">★★★★★</div>
                <p className="text-sm leading-relaxed text-charcoal/80">"{r.text}"</p>
                <p className="mt-4 text-xs tracking-widest text-primary uppercase">{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <InstagramReels />
    </div>
  );
}
