import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Bag — Satyabhama" },
      {
        name: "description",
        content: "Review your Satyabhama shopping bag.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();

  const shipping =
    subtotal >= 999 || subtotal === 0 ? 0 : 79;

  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:py-24">

        <div className="bg-blush-gradient mx-auto grid h-20 w-20 place-items-center rounded-full sm:h-24 sm:w-24">
          <ShoppingBag className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
        </div>

        <h1 className="mt-5 font-serif text-2xl font-medium sm:mt-6 sm:text-3xl">
          Your bag is empty
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Discover our luxury edit and add pieces you'll love.
        </p>

        <Link
          to="/products"
          className="bg-rose-gradient text-primary-foreground mt-6 inline-flex rounded-full px-6 py-3 text-sm uppercase tracking-wider shadow-luxe sm:mt-8 sm:px-8 sm:py-3.5"
        >
          Start Shopping
        </Link>

      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">

      <h1 className="mb-6 font-serif text-3xl font-medium sm:mb-8 sm:text-4xl">
        Shopping Bag
      </h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">

        <div className="space-y-4">

          {items.map((item) => (

            <div
              key={item.productId}
              className="grid grid-cols-[80px_1fr] gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-soft sm:grid-cols-[120px_1fr_auto] sm:gap-4 sm:rounded-2xl sm:p-4"
            >

              <div className="bg-blush aspect-square overflow-hidden rounded-lg sm:rounded-xl">

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
                  className="line-clamp-2 font-serif text-base font-medium hover:text-primary sm:text-lg"
                >
                  {item.name}
                </Link>

                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {formatINR(item.price)} each
                </p>

                <div className="mt-3 flex items-center justify-between">

                  <div className="flex items-center rounded-full border border-border">

                    <button
                      onClick={() =>
                        updateQty(item.productId, item.quantity - 1)
                      }
                      className="hover:bg-blush grid h-8 w-8 place-items-center rounded-l-full sm:h-9 sm:w-9"
                    >
                      <Minus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>

                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        updateQty(item.productId, item.quantity + 1)
                      }
                      className="hover:bg-blush grid h-8 w-8 place-items-center rounded-r-full sm:h-9 sm:w-9"
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>

                  </div>

                  <button
                    onClick={() =>
                      removeItem(item.productId)
                    }
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                </div>

              </div>

              <div className="col-span-2 flex justify-end sm:col-span-1 sm:block sm:text-right">

                <div className="font-serif text-lg font-semibold">
                  {formatINR(item.price * item.quantity)}
                </div>

              </div>

            </div>

          ))}

        </div>

                <aside className="h-fit rounded-2xl border border-border/70 bg-blush/40 p-5 shadow-soft lg:sticky lg:top-32 lg:p-6">

          <h2 className="font-serif text-xl font-medium sm:text-2xl">
            Order Summary
          </h2>

          <dl className="mt-4 space-y-3 text-sm sm:mt-5">

            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Subtotal
              </dt>

              <dd className="font-medium">
                {formatINR(subtotal)}
              </dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Shipping
              </dt>

              <dd className="font-medium">
                {shipping === 0 ? (
                  <span className="text-primary">
                    Free
                  </span>
                ) : (
                  formatINR(shipping)
                )}
              </dd>
            </div>

            {subtotal > 0 && subtotal < 999 && (

              <p className="rounded-lg bg-background p-3 text-xs text-muted-foreground">
                Add <span className="font-semibold">
                  {formatINR(999 - subtotal)}
                </span>{" "}
                more to get FREE shipping.
              </p>

            )}

            <div className="flex items-baseline justify-between border-t border-border pt-4">

              <dt className="font-serif text-lg">
                Total
              </dt>

              <dd className="font-serif text-2xl font-semibold">
                {formatINR(total)}
              </dd>

            </div>

          </dl>

          <Link
            to="/checkout"
            className="
              bg-rose-gradient
              text-primary-foreground

              mt-6
              flex
              w-full
              items-center
              justify-center

              rounded-full

              px-6
              py-3.5

              text-sm
              uppercase
              tracking-wider

              shadow-luxe
              transition
              hover:scale-[1.01]
            "
          >
            Proceed to Checkout
          </Link>

          <Link
            to="/products"
            className="mt-4 flex items-center justify-center text-sm text-primary hover:underline"
          >
            Continue Shopping
          </Link>

        </aside>

      </div>

    </div>
  );
}