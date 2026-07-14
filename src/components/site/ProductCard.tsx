import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { discountPercent, formatINR } from "@/lib/format";
import { resolveImages } from "@/lib/images";
import type { Product } from "@/lib/queries";
import { useState } from "react";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const imgs = resolveImages(product.images);
  const [hover, setHover] = useState(false);
  const discount = discountPercent(product.price, product.original_price);

  return (
    <div
      className="group hover-lift relative overflow-hidden rounded-2xl border border-border/70 bg-card"
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
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
        />
        {imgs[1] && (
          <img
            src={imgs[1]}
            alt=""
            aria-hidden
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${hover ? "opacity-100" : "opacity-0"}`}
          />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_new && (
            <span className="bg-charcoal text-pearl rounded-full px-2.5 py-1 text-[10px] tracking-widest uppercase">
              New
            </span>
          )}
          {product.is_bestseller && (
            <span className="bg-rose-gradient text-primary-foreground rounded-full px-2.5 py-1 text-[10px] tracking-widest uppercase">
              Bestseller
            </span>
          )}
          {discount && (
            <span className="bg-ruby rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white">
              -{discount}%
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toast.success("Added to wishlist");
          }}
          className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
          aria-label="Add to wishlist"
        >
          <Heart className="h-4 w-4" />
        </button>
      </Link>

      <div className="p-4">
        <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {product.category_slug}
        </div>
        <Link to="/products/$slug" params={{ slug: product.slug }}>
          <h3 className="mt-1.5 line-clamp-1 font-serif text-lg font-semibold transition group-hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-champagne text-champagne" />
          <span className="font-medium text-foreground">{product.rating.toFixed(1)}</span>
          <span>· {product.review_count}</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-xl font-semibold">{formatINR(product.price)}</span>
            {product.original_price && (
              <span className="text-xs text-muted-foreground line-through">
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
            className="bg-charcoal hover:bg-primary text-pearl rounded-full px-3.5 py-2 text-xs tracking-wider uppercase transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
