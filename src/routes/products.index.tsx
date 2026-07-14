import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/queries";
import { Link } from "@tanstack/react-router";

const searchSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["latest", "price-asc", "price-desc", "rating"]).optional(),
});

export const Route = createFileRoute("/products/")({
  validateSearch: (input) => searchSchema.parse(input),
  head: () => ({
    meta: [
      { title: "Shop All — Satyabhama" },
      {
        name: "description",
        content: "Browse the full Satyabhama collection of luxury jewellery, handbags and gifts.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: categories = [] } = useQuery(categoriesQuery());
  const { data: products = [], isLoading } = useQuery(
    productsQuery({ category: search.category }),
  );

  const sorted = useMemo(() => {
    const arr = [...products];
    switch (search.sort) {
      case "price-asc":
        return arr.sort((a, b) => a.price - b.price);
      case "price-desc":
        return arr.sort((a, b) => b.price - a.price);
      case "rating":
        return arr.sort((a, b) => b.rating - a.rating);
      default:
        return arr;
    }
  }, [products, search.sort]);

  const activeCategory = categories.find((c) => c.slug === search.category);

  return (
    <div>
      <section className="bg-blush-gradient border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Collection</p>
          <h1 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">
            {activeCategory?.name ?? "Shop All"}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            {activeCategory?.description ?? "Explore our full luxury edit — jewellery, bangles, bags, beauty and more."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            <Link
              to="/products"
              search={{}}
              className={`rounded-full border px-4 py-1.5 text-xs tracking-wide uppercase transition ${
                !search.category
                  ? "bg-charcoal text-pearl border-charcoal"
                  : "border-border hover:border-primary hover:text-primary"
              }`}
            >
              All
            </Link>
            {categories.map((c) => (
              <Link
                key={c.slug}
                to="/products"
                search={{ category: c.slug }}
                className={`rounded-full border px-4 py-1.5 text-xs tracking-wide uppercase transition ${
                  search.category === c.slug
                    ? "bg-charcoal text-pearl border-charcoal"
                    : "border-border hover:border-primary hover:text-primary"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          <select
            value={search.sort ?? "latest"}
            onChange={(e) =>
              navigate({
                search: {
                  ...search,
                  sort: e.target.value === "latest" ? undefined : (e.target.value as never),
                },
              })
            }
            className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-xs tracking-wide uppercase"
          >
            <option value="latest">Sort: Latest</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/6] animate-pulse rounded-2xl bg-blush" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed py-24 text-center text-muted-foreground">
            No products in this collection yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {sorted.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
