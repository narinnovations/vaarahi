import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { discountPercent, formatINR } from "@/lib/format";
import { resolveImages } from "@/lib/images";
import type { Product } from "@/lib/queries";
import { useState } from "react";
import { useWishlist } from "@/lib/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const {
    add,
    remove,
    isWishlisted,
    loading,
  } = useWishlist();
  const imgs = resolveImages(product.images);
  const [hover, setHover] = useState(false);

  const discount = discountPercent(
    product.price,
    product.original_price
  );

  return (
    <div
      className="group hover-lift relative overflow-hidden rounded-xl sm:rounded-2xl border border-border/70 bg-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-[4/5] overflow-hidden bg-blush"
      >
        <img
          src={imgs[0]}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {imgs[1] && (
          <img
            src={imgs[1]}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hover ? "opacity-100" : "opacity-0"
              }`}
          />
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1 sm:top-3 sm:left-3 sm:gap-1.5">
          {product.is_new && (
            <span className="rounded-full bg-charcoal px-2 py-0.5 text-[9px] uppercase tracking-wider text-pearl sm:px-2.5 sm:py-1 sm:text-[10px]">
              New
            </span>
          )}

          {product.is_bestseller && (
            <span className="bg-rose-gradient rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider text-primary-foreground sm:px-2.5 sm:py-1 sm:text-[10px]">
              Bestseller
            </span>
          )}

          {discount && (
            <span className="rounded-full bg-ruby px-2 py-0.5 text-[9px] font-semibold text-white sm:px-2.5 sm:py-1 sm:text-[10px]">
              -{discount}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();

            if (loading) return;

            if (isWishlisted(product.id)) {
              const ok = await remove(product.id);

              if (ok) {
                toast.success("Removed from wishlist");
              } else {
                toast.error("Unable to remove");
              }
            } else {
              const ok = await add(product.id);

              if (ok) {
                toast.success("Added to wishlist");
              } else {
                toast.error("Please login first");
              }
            }
          }}
          className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background sm:top-3 sm:right-3 sm:h-9 sm:w-9"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${!loading && isWishlisted(product.id)
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground"
              }`}
          />
        </button>
      </Link>

      <div className="p-3 sm:p-4">
        <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground sm:text-[10px]">
          {product.category_slug}
        </div>

        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
        >
          <h3 className="mt-1 line-clamp-2 min-h-[2.6rem] font-serif text-base font-semibold transition group-hover:text-primary sm:mt-1.5 sm:line-clamp-1 sm:min-h-0 sm:text-lg">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground sm:mt-1.5 sm:text-xs">
          <Star className="h-3 w-3 fill-champagne text-champagne sm:h-3.5 sm:w-3.5" />

          <span className="font-medium text-foreground">
            {product.rating.toFixed(1)}
          </span>

          <span>· {product.review_count}</span>
        </div>

        <div className="mt-2 flex items-end justify-between gap-2 sm:mt-3">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="font-serif text-lg font-semibold sm:text-xl">
              {formatINR(product.price)}
            </span>

            {product.original_price && (
              <span className="text-[10px] line-through text-muted-foreground sm:text-xs">
                {formatINR(product.original_price)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();

              addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.images[0] ?? "",
              });

              toast.success(`${product.name} added to bag`);
            }}
            className="rounded-full bg-charcoal px-3 py-1.5 text-[10px] uppercase tracking-wider text-pearl transition hover:bg-primary sm:px-3.5 sm:py-2 sm:text-xs"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}