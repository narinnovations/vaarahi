import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeroSlider } from "@/components/site/HeroSlider";
import { CategoryStrip } from "@/components/site/CategoryStrip";
import { ProductCard } from "@/components/site/ProductCard";
import { InstagramReels } from "@/components/site/InstagramReels";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { ArrowRight, Award, Gem, Sparkles, Truck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: featured = [] } = useQuery(productsQuery({ featured: true, limit: 8 }));
  const { data: bestsellers = [] } = useQuery(productsQuery({ bestseller: true, limit: 4 }));

  return (
    <div>
      <CategoryStrip categories={categories} />

      <HeroSlider />

      {/* Trust strip */}
      <section className="border-b border-border/60 bg-blush/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
          {[
            { Icon: Gem, title: "Handcrafted", copy: "In small batches" },
            { Icon: Award, title: "BIS Hallmark", copy: "Where applicable" },
            { Icon: Truck, title: "Free Shipping", copy: "Orders above ₹999" },
            { Icon: Sparkles, title: "Easy Returns", copy: "7-day happiness" },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="bg-rose-gradient text-primary-foreground grid h-11 w-11 shrink-0 place-items-center rounded-full shadow-soft">
                <t.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-serif text-lg leading-tight font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.copy}</div>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Featured Edit</p>
            <h2 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">
              The Season's Loveliest
            </h2>
          </div>
          <Link
            to="/products"
            className="hidden items-center gap-1 text-sm text-primary hover:underline sm:inline-flex"
          >
            Shop all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Editorial banner */}
      <section className="mx-auto my-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-rose-gradient text-primary-foreground relative overflow-hidden rounded-3xl px-8 py-16 shadow-luxe sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-champagne/40 blur-3xl" />
          <div className="relative max-w-xl">
            <p className="text-[10px] tracking-[0.35em] uppercase opacity-80">Limited Edition</p>
            <h3 className="mt-4 font-serif text-4xl leading-tight font-medium sm:text-5xl">
              The Bridal Heirloom Collection
            </h3>
            <p className="mt-4 text-base opacity-90">
              Kundan, uncut polki and rose-gold pieces — designed to be the star of your
              once-in-a-lifetime moment.
            </p>
            <Link
              to="/products"
              search={{ category: "necklaces" }}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium tracking-wide text-primary shadow-luxe transition hover:scale-[1.02]"
            >
              Explore Collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Most Loved</p>
          <h2 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">Bestsellers</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground">
            Pieces our customers keep coming back for.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-blush-gradient py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs tracking-[0.3em] text-primary uppercase">Kind Words</p>
            <h2 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">From Our Sisterhood</h2>
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
                className="rounded-2xl border border-border/60 bg-background p-6 shadow-soft"
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
