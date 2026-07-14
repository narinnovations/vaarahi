import { Link } from "@tanstack/react-router";
import { resolveImage } from "@/lib/images";
import type { Category } from "@/lib/queries";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-primary uppercase">Shop by</p>
          <h2 className="mt-2 font-serif text-4xl font-medium sm:text-5xl">Curated Categories</h2>
        </div>
        <Link
          to="/products"
          className="hidden text-sm text-primary underline-offset-4 hover:underline sm:inline"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to="/products"
            search={{ category: c.slug }}
            className="group flex flex-col items-center gap-3"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-full border border-rose-gold/30 shadow-soft transition group-hover:shadow-luxe">
              <img
                src={resolveImage(c.image_url)}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent" />
            </div>
            <span className="text-center font-serif text-base font-medium transition group-hover:text-primary">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
