import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Heart, ShieldCheck, Star, Truck, RotateCcw, Share2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { productBySlugQuery, productsQuery } from "@/lib/queries";
import { resolveImages } from "@/lib/images";
import { discountPercent, formatINR } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/ProductCard";
import { useBuyNow } from "@/lib/buy-now";


export const Route = createFileRoute("/products/$slug")({
  component: ProductDetailPage,
  head: ({ params }) => ({
    meta: [
      { title: `${prettify(params.slug)} — Satyabhama` },
      {
        name: "description",
        content: "Handcrafted luxury piece from the Satyabhama collection.",
      },
    ],
  }),
});

function prettify(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function ProductDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useQuery(productBySlugQuery(slug));
  const { data: related = [] } = useQuery({
    ...productsQuery({ category: product?.category_slug, limit: 8 }),
    enabled: Boolean(product?.category_slug),
  });
  const { addItem } = useCart();
  const { setItem } = useBuyNow();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
  });
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveImg(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);
  const colors = useMemo(() => {
    return [
      ...new Set(
        (product?.variants ?? [])
          .map((v) => v.color)
          .filter((v): v is string => Boolean(v))
      ),
    ];
  }, [product?.variants]);

  const sizes = useMemo(() => {
    return [
      ...new Set(
        (product?.variants ?? [])
          .filter((v) => !selectedColor || v.color === selectedColor)
          .map((v) => v.size)
          .filter((v): v is string => Boolean(v))
      ),
    ];
  }, [product?.variants, selectedColor]);

  const weights = useMemo(() => {
    return [
      ...new Set(
        (product?.variants ?? [])
          .filter(
            (v) =>
              (!selectedColor || v.color === selectedColor) &&
              (!selectedSize || v.size === selectedSize)
          )
          .map((v) => v.weight)
          .filter((v): v is string => Boolean(v))
      ),
    ];
  }, [product?.variants, selectedColor, selectedSize]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="aspect-square animate-pulse rounded-2xl bg-blush" />
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded bg-blush" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-blush" />
          <div className="h-6 w-1/2 animate-pulse rounded bg-blush" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-primary underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const imgs = resolveImages(product.images);

  const filtered = related.filter((r) => r.id !== product.id).slice(0, 4);
  const totalStock =
    product.variants?.length
      ? product.variants.reduce((sum, v) => sum + v.stock, 0)
      : product.stock;




  const selectedVariant =
    product.variants.find((v) => v.size === selectedSize) ??
    product.variants[0] ??
    null;
  const displayPrice = selectedVariant?.price ?? product.price;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const outOfStock = displayStock <= 0;


  const discount = discountPercent(
    displayPrice,
    product.original_price
  );

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="text-xs tracking-wide text-muted-foreground uppercase">
          <Link to="/" className="hover:text-primary">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/products" search={{ category: product.category_slug }} className="hover:text-primary">
            {product.category_slug}
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Gallery */}
        <div>
          <div
            ref={emblaRef}
            className="bg-blush relative overflow-hidden rounded-3xl border border-border/60 shadow-card"
          >
            <div className="flex">
              {imgs.map((src, index) => (
                <div
                  key={index}
                  className="relative min-w-full flex-[0_0_100%] aspect-square"
                >
                  <img
                    src={src}
                    alt={`${product.name} ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            {discount && (
              <span className="bg-ruby absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold text-white">
                -{discount}% OFF
              </span>
            )}
          </div>
          {imgs.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto whitespace-nowrap pb-2">
              {imgs.map((src, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveImg(i);
                    emblaApi?.scrollTo(i);
                  }}
                  className={`aspect-square w-20 min-w-[80px] flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${i === activeImg
                    ? "border-primary"
                    : "border-transparent opacity-60"
                    }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-xs tracking-[0.3em] text-primary uppercase">{product.category_slug}</p>
          <h1 className="mt-2 font-serif text-3xl leading-tight font-medium sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm">
            <div className="flex text-champagne">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-champagne" : ""}`}
                />
              ))}
            </div>
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">· {product.review_count} reviews</span>
          </div>
          {product.variants.length > 0 && (
            <div className="mt-8 space-y-6">



              {sizes.length > 0 && (
                <div>
                  <h3 className="mb-3 font-medium">Size</h3>

                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setSelectedSize(size);
                          setSelectedWeight("");
                        }}
                        className={`rounded-full border px-5 py-2 transition ${selectedSize === size
                          ? "bg-primary text-white border-primary"
                          : "bg-white hover:border-primary"
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}



            </div>
          )}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-serif text-4xl font-semibold">{formatINR(displayPrice)}</span>
            {product.original_price && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {formatINR(product.original_price)}
                </span>
                {discount && (
                  <span className="text-ruby text-sm font-semibold">Save {discount}%</span>
                )}
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Inclusive of all taxes · Free shipping above ₹999
          </p>

          <p className="mt-6 leading-relaxed text-charcoal/80">{product.description}</p>

          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="mb-3 text-base font-semibold">
              Product Details
            </h3>

            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">

              {selectedVariant?.color && (
                <div>
                  <p className="text-muted-foreground">Color</p>
                  <p className="font-medium">{selectedVariant.color}</p>
                </div>
              )}

              {selectedVariant?.weight && (
                <div>
                  <p className="text-muted-foreground">Weight</p>
                  <p className="font-medium">{selectedVariant.weight} g</p>
                </div>
              )}

              {selectedVariant?.material && (
                <div>
                  <p className="text-muted-foreground">Material</p>
                  <p className="font-medium">{selectedVariant.material}</p>
                </div>
              )}

              {selectedVariant?.purity && (
                <div>
                  <p className="text-muted-foreground">Purity</p>
                  <p className="font-medium">{selectedVariant.purity}</p>
                </div>
              )}

              {selectedVariant?.finish && (
                <div>
                  <p className="text-muted-foreground">Finish</p>
                  <p className="font-medium">{selectedVariant.finish}</p>
                </div>
              )}

              {selectedVariant?.style && (
                <div>
                  <p className="text-muted-foreground">Style</p>
                  <p className="font-medium">{selectedVariant.style}</p>
                </div>
              )}

              {selectedVariant?.occasion && (
                <div>
                  <p className="text-muted-foreground">Occasion</p>
                  <p className="font-medium">{selectedVariant.occasion}</p>
                </div>
              )}

            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button
                onClick={() => {
                  if (qty > 1) {
                    setQty((q) => q - 1);
                  }
                }}
                className="hover:bg-blush grid h-11 w-11 place-items-center rounded-l-full"
                aria-label="decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => {
                  if (qty < displayStock) {
                    setQty((q) => q + 1);
                  } else {
                    toast.error(`Only ${displayStock} item(s) available`);
                  }
                }}
                disabled={qty >= displayStock}
                className="hover:bg-blush grid h-11 w-11 place-items-center rounded-r-full"
                aria-label="increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <span
              className={`text-xs ${displayStock > 0
                ? "text-emerald-600"
                : "text-red-600 font-semibold"
                }`}
            >
              {displayStock > 0
                ? `${displayStock} item(s) available`
                : "Out of Stock"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {/* Add to Bag */}
            <button
              disabled={outOfStock}
              onClick={() => {
                if (outOfStock) return;

                addItem(
                  {
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: displayPrice,
                    image: product.images[0] ?? "",
                  },
                  qty,
                );

                toast.success("Added to bag");
              }}
              className={`flex-1 rounded-full px-8 py-4 text-sm tracking-wider uppercase sm:flex-none ${outOfStock
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-charcoal text-pearl transition hover:bg-primary"
                }`}
            >
              {outOfStock ? "Out of Stock" : "Add to Bag"}
            </button>

            {/* Buy Now */}
            <button
              disabled={outOfStock}
              onClick={() => {
                if (outOfStock) return;

                setItem({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: displayPrice,
                  image: product.images[0] ?? "",
                  quantity: qty,
                });

                navigate({ to: "/checkout" });
              }}

              className={`flex-1 rounded-full px-8 py-4 text-sm tracking-wider uppercase shadow-luxe sm:flex-none ${outOfStock
                ? "cursor-not-allowed bg-gray-300 text-gray-500"
                : "bg-rose-gradient text-primary-foreground transition hover:scale-[1.02]"
                }`}
            >
              {outOfStock ? "Unavailable" : "Buy Now"}
            </button>

            {/* Wishlist */}
            <button
              onClick={() => toast.success("Saved to wishlist")}
              className="hover:bg-blush grid h-14 w-14 place-items-center rounded-full border border-border"
              aria-label="Add to wishlist"
            >
              <Heart className="h-5 w-5" />
            </button>

            {/* Share */}
            <button
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share) {
                  navigator.share({
                    title: product.name,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied");
                }
              }}
              className="hover:bg-blush grid h-14 w-14 place-items-center rounded-full border border-border"
              aria-label="Share"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6 text-xs">
            {[
              { Icon: Truck, label: "Free shipping ₹999+" },
              { Icon: RotateCcw, label: "7-day returns" },
              { Icon: ShieldCheck, label: "Secure checkout" },
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5 text-center">
                <t.Icon className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <h2 className="mb-8 font-serif text-3xl font-medium">You may also love</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
