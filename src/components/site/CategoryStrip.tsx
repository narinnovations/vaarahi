import { Link } from "@tanstack/react-router";
import { resolveImage } from "@/lib/images";
import type { Category } from "@/lib/queries";

export function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-6 flex items-end justify-between sm:mb-10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary sm:text-xs">
            Shop by
          </p>

          <h2 className="mt-2 font-serif text-3xl font-medium sm:text-5xl">
            Curated Categories
          </h2>
        </div>

        <Link
          to="/products"
          className="hidden text-sm text-primary underline-offset-4 hover:underline sm:inline"
        >
          View all
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
        {categories.map((c) => (
          <Link
            key={c.slug}
            to="/products"
            search={{ category: c.slug }}
            className="group flex flex-col items-center shrink-0 snap-start"
          >
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28 overflow-hidden rounded-full border border-rose-gold/30 shadow-soft transition duration-300 group-hover:shadow-luxe">
              <img
                src={resolveImage(c.image_url)}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent" />
            </div>

            <span className="mt-3 text-center font-serif text-lg font-medium transition group-hover:text-primary sm:text-xl lg:text-base">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}