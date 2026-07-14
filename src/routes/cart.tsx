import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Bag — Satyabhama" },
      { name: "description", content: "Review your Satyabhama shopping bag." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();
  const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 79;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="bg-blush-gradient mx-auto grid h-24 w-24 place-items-center rounded-full">
          <ShoppingBag className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium">Your bag is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Discover our luxury edit and add pieces you'll love.
        </p>
        <Link
          to="/products"
          className="bg-rose-gradient text-primary-foreground mt-8 inline-flex rounded-full px-8 py-3.5 text-sm tracking-wider uppercase shadow-luxe"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-serif text-4xl font-medium">Shopping Bag</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="grid grid-cols-[96px_1fr_auto] items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-soft sm:grid-cols-[120px_1fr_auto]"
            >
              <div className="bg-blush aspect-square overflow-hidden rounded-xl">
                <img
                  src={resolveImage(item.image)}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <Link
                  to="/products/$slug"
                  params={{ slug: item.slug }}
                  className="line-clamp-2 font-serif text-lg font-medium hover:text-primary"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatINR(item.price)} each</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="hover:bg-blush grid h-9 w-9 place-items-center rounded-l-full"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="hover:bg-blush grid h-9 w-9 place-items-center rounded-r-full"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-lg font-semibold">
                  {formatINR(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border/70 bg-blush/40 p-6 shadow-soft lg:sticky lg:top-32">
          <h2 className="font-serif text-2xl font-medium">Order Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium">
                {shipping === 0 ? (
                  <span className="text-primary">Free</span>
                ) : (
                  formatINR(shipping)
                )}
              </dd>
            </div>
            {subtotal > 0 && subtotal < 999 && (
              <p className="text-xs text-muted-foreground">
                Add {formatINR(999 - subtotal)} more for free shipping.
              </p>
            )}
            <div className="flex items-baseline justify-between border-t border-border pt-4">
              <dt className="font-serif text-lg">Total</dt>
              <dd className="font-serif text-2xl font-semibold">{formatINR(total)}</dd>
            </div>
          </dl>
          <Link
            to="/checkout"
            className="bg-rose-gradient text-primary-foreground mt-6 flex items-center justify-center rounded-full px-6 py-4 text-sm tracking-wider uppercase shadow-luxe transition hover:scale-[1.01]"
          >
            Proceed to Checkout
          </Link>
          <Link
            to="/products"
            className="mt-3 flex items-center justify-center text-sm text-primary hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
