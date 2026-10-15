import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";
import { supabase } from "@/integrations/supabase/client";
import { useBuyNow } from "@/lib/buy-now";
import { useSettings } from "@/lib/site-settings";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Vaarahi" },
      { name: "description", content: "Complete your order at Vaarahi." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clear } = useCart();
  const { item: buyNowItem, clear: clearBuyNow } = useBuyNow();
  const checkoutItems = buyNowItem ? [buyNowItem] : items;

  const checkoutSubtotal = checkoutItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const { user } = useAuth();
  const settings = useSettings();
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  const shippingSettings = settings.shipping;

  console.log("Checkout subtotal:", checkoutSubtotal);
  console.log("Shipping settings:", shippingSettings);
  console.log("Calculated shipping:",
    checkoutSubtotal === 0 ||
      checkoutSubtotal >= Number(shippingSettings.free_above)
      ? 0
      : Number(shippingSettings.flat_rate)
  );

  const shipping =
    checkoutSubtotal === 0 ||
      checkoutSubtotal >= Number(shippingSettings.free_above)
      ? 0
      : Number(shippingSettings.flat_rate);


  const total = Math.max(
    checkoutSubtotal + shipping - discount,
    0,
  );
  if (checkoutItems.length === 0 && !placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-serif text-3xl">Your bag is empty</h1>
        <Link
          to="/products"
          className="bg-rose-gradient text-primary-foreground mt-6 inline-flex rounded-full px-6 py-3 text-sm tracking-wider uppercase"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <div className="bg-blush-gradient mx-auto grid h-24 w-24 place-items-center rounded-full">
          <CheckCircle2 className="h-12 w-12 text-primary" />
        </div>
        <h1 className="mt-6 font-serif text-4xl font-medium">Thank you</h1>
        <p className="mt-3 text-muted-foreground">
          Your order has been placed. A confirmation will arrive on your email &amp; WhatsApp shortly.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/"
            className="bg-charcoal text-pearl rounded-full px-6 py-3 text-sm tracking-wider uppercase"
          >
            Back to Home
          </Link>
          <Link
            to="/products"
            className="rounded-full border border-border px-6 py-3 text-sm tracking-wider uppercase"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }
  const applyCoupon = async () => {
    console.log("applyCoupon called", couponCode);

    if (!couponCode.trim()) {
      toast.error("Enter coupon code");
      return;
    }

    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim())
      .eq("active", true)
      .or("expires_at.is.null,expires_at.gt.now()")
      .single();

    console.log("Coupon data:", data);
    console.log("Coupon error:", error);

    if (error || !data) {
      toast.error("Invalid coupon");
      return;
    }

    const minOrder = Number(data.min_order ?? 0);

    if (checkoutSubtotal < minOrder) {
      const remaining = minOrder - checkoutSubtotal;

      toast.error(
        `Minimum order is ${formatINR(minOrder)}. Add ${formatINR(
          remaining
        )} more to use ${data.code}.`
      );

      return;
    }

    let value = 0;

    if (data.discount_type === "percent") {
      value =
        checkoutSubtotal *
        Number(data.discount_value) /
        100;

      if (data.max_discount) {
        value = Math.min(value, Number(data.max_discount));
      }
    } else {
      value = Number(data.discount_value);
    }

    setCoupon(data);
    setDiscount(value);

    toast.success(
      `${data.code} applied successfully! You saved ${formatINR(value)}`
    );

  };
  const loadCoupons = async () => {
    console.log("Button clicked");

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      console.log("Data:", data);
      console.log("Error:", error);

      if (!error && data) {
        setAvailableCoupons(data);
      }

      setShowCoupons(true);
    } catch (err) {
      console.error(err);
    }
  };
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to place your order");
      navigate({ to: "/auth" });
      return;
    }
    const fd = new FormData(e.currentTarget as HTMLFormElement);

    // Validate Indian mobile number and six-digit PIN before any database writes.
    const phoneInput = String(fd.get("phone") ?? "").trim();
    const normalizedPhone = phoneInput.replace(/[\s-]/g, "");
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(normalizedPhone)) {
      toast.error("Enter a valid 10-digit Indian mobile number, with optional +91");
      return;
    }

    const pin = String(fd.get("pin") ?? "").trim();
    if (!/^\d{6}$/.test(pin)) {
      toast.error("Enter a valid 6-digit PIN code");
      return;
    }

    setSubmitting(true);

    try {

      // ============================
      // Validate latest stock
      // ============================

      const productIds = checkoutItems.map(
        (i) => i.productId,
      );

      const { data: latestProducts, error: stockError } = await supabase
        .from("products")
        .select("id,name,stock")
        .in("id", productIds);

      if (stockError) throw stockError;

      for (const cartItem of checkoutItems) {

        const dbProduct = latestProducts?.find(
          p => p.id === cartItem.productId
        );

        if (!dbProduct) {
          toast.error(`${cartItem.name} not found`);
          return;
        }

        if (dbProduct.stock <= 0) {
          toast.error(`${dbProduct.name} is out of stock`);
          return;
        }

        if (cartItem.quantity > dbProduct.stock) {
          toast.error(
            `Only ${dbProduct.stock} item(s) available for ${dbProduct.name}`
          );
          return;
        }
      }
      // Generate Order Number
      const orderNumber =
        "VRH" +
        new Date().getFullYear().toString().slice(-2) +
        Date.now().toString().slice(-6);
      // ============================
      // Continue placing order
      // ============================
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,

          customer_name: String(fd.get("name") ?? ""),
          customer_email: String(fd.get("email") ?? user.email ?? ""),
          customer_phone: phoneInput,

          address_line1: String(fd.get("address") ?? "").trim(),
          address_line2: String(fd.get("locality") ?? "").trim() || null,
          city: String(fd.get("city") ?? "").trim(),
          state: String(fd.get("state") ?? "").trim(),
          pincode: pin,

          subtotal: checkoutSubtotal,
          shipping,
          discount,
          coupon_code: coupon?.code ?? null,
          total,

          payment_method: String(fd.get("pay") ?? "cod"),
          status: "pending",
          payment_status: "pending",
        })
        .select("id")
        .single();
      if (error || !order) throw error ?? new Error("Failed to create order");
      const { error: itemsErr } = await supabase.from("order_items").insert(
        checkoutItems.map((i) => ({
          order_id: order.id,
          product_id: i.productId,
          product_name: i.name,
          product_slug: i.slug,
          price: i.price,
          quantity: i.quantity,
          image: i.image,
        })),
      );
      if (itemsErr) throw itemsErr;
      // ============================
      // Reduce product stock
      // ============================

      for (const cartItem of checkoutItems) {
        const { data: product, error: fetchError } = await supabase
          .from("products")
          .select("stock")
          .eq("id", cartItem.productId)
          .single();

        if (fetchError) throw fetchError;

        const newStock = Math.max(0, product.stock - cartItem.quantity);

        const { error: updateError } = await supabase
          .from("products")
          .update({
            stock: newStock,
          })
          .eq("id", cartItem.productId);

        if (updateError) throw updateError;
      }
      toast.success("Order placed successfully");
      if (buyNowItem) {
        clearBuyNow();
      } else {
        clear();
      }

      setPlaced(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  console.log("showCoupons =", showCoupons);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-serif text-4xl font-medium">Checkout</h1>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <Section title="Contact">
            <Field label="Full name" required>
              <input name="name" required className="input" placeholder="Your name" defaultValue={user?.user_metadata?.full_name ?? ""} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" required>
                <input name="email" type="email" required className="input" defaultValue={user?.email ?? ""} placeholder="you@email.com" />
              </Field>
              <Field label="Phone" required>
                <input
                  name="phone"
                  type="tel"
                  required
                  className="input"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={15}
                  title="Enter a valid 10-digit Indian mobile number, with optional +91"
                />
              </Field>
            </div>
          </Section>

          <Section title="Shipping address">
            <Field label="House / Flat No., Street" required>
              <input
                name="address"
                required
                className="input"
                placeholder="Door no., street name"
                autoComplete="address-line1"
              />
            </Field>
            <Field label="Area / Locality / Landmark" required>
              <input
                name="locality"
                required
                className="input"
                placeholder="Area, locality, nearby landmark"
                autoComplete="address-line2"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City" required>
                <input name="city" required className="input" placeholder="City / town / village" autoComplete="address-level2" />
              </Field>
              <Field label="State" required>
                <input name="state" required className="input" placeholder="State" autoComplete="address-level1" />
              </Field>
              <Field label="PIN" required>
                <input
                  name="pin"
                  required
                  className="input"
                  placeholder="6-digit PIN"
                  pattern="[0-9]{6}"
                  title="Enter a valid 6-digit PIN code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                />
              </Field>
            </div>
          </Section>

          <Section title="Payment method">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: "upi", label: "UPI / GPay / PhonePe" },
                { id: "card", label: "Credit / Debit Card" },
                { id: "netbanking", label: "Net Banking" },
                { id: "cod", label: "Cash on Delivery" },
              ].map((m, i) => (
                <label
                  key={m.id}
                  className="hover:border-primary flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-background p-4 transition has-[input:checked]:border-primary has-[input:checked]:bg-blush/60"
                >
                  <input
                    type="radio"
                    name="pay"
                    value={m.id}
                    defaultChecked={i === 0}
                    className="text-primary accent-primary"
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              This is a demo checkout — no payment gateway is connected yet. Add Razorpay or Stripe
              to accept real payments.
            </p>
          </Section>
        </div>

        <aside className="h-fit rounded-2xl border border-border/70 bg-blush/40 p-6 shadow-soft lg:sticky lg:top-32">
          <h2 className="font-serif text-xl font-medium">Your bag</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-auto pr-1">
            {checkoutItems.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 text-sm">
                <div className="bg-blush h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={resolveImage(item.image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <span className="font-medium">{formatINR(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {!coupon ? (
            <div className="mt-4">
              <label className="mb-2 block text-xs uppercase tracking-wider">
                Coupon
              </label>

              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-full border border-border px-4 py-3"
                />

                <button
                  type="button"
                  onClick={applyCoupon}
                  className="rounded-full bg-primary px-6 text-white"
                >
                  Apply
                </button>
              </div>
              <button
                type="button"
                onClick={loadCoupons}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                🎁 View Available Coupons
              </button>
            </div>
          ) : null}
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(checkoutSubtotal)}</dd>
            </div>

            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "FREE" : formatINR(shipping)}</dd>
            </div>

            {coupon && (
              <>
                <div className="flex justify-between text-green-600 font-medium">
                  <dt>Discount</dt>
                  <dd>-{formatINR(discount)}</dd>
                </div>

                <div className="flex items-center justify-between text-sm text-green-600">
                  <dt>
                    • {coupon.code}{" "}
                    {coupon.discount_type === "percent"
                      ? `(${coupon.discount_value}% OFF)`
                      : `(₹${coupon.discount_value} OFF)`}
                  </dt>

                  <div className="flex items-center gap-3">
                    <span>-{formatINR(discount)}</span>

                    <button
                      type="button"
                      onClick={() => {
                        setCoupon(null);
                        setCouponCode("");
                        setDiscount(0);
                      }}
                      className="text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-baseline justify-between border-t border-border pt-3 text-lg">
              <dt className="font-serif">Total</dt>
              <dd className="font-serif font-semibold">
                {formatINR(total)}
              </dd>
            </div>

            {coupon && (
              <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✅ You saved <strong>{formatINR(discount)}</strong> on this order!
              </div>
            )}
          </dl>

          <button
            type="submit"
            disabled={submitting}
            className="bg-rose-gradient text-primary-foreground mt-6 w-full rounded-full py-4 text-sm tracking-wider uppercase shadow-luxe transition hover:scale-[1.01] disabled:opacity-60"
          >
            {submitting ? "Placing order…" : `Place Order · ${formatINR(total)}`}
          </button>
        </aside>
      </form>

      {showCoupons && (
        console.log("Popup opened"),
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                🎁 Available Coupons
              </h2>

              <button
                onClick={() => setShowCoupons(false)}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="max-h-[400px] space-y-4 overflow-y-auto">
              {availableCoupons.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No coupons available
                </p>
              ) : (
                availableCoupons.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl border p-4"
                  >
                    <h3 className="font-semibold text-primary">
                      {c.code}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.discount_type === "percent"
                        ? `${c.discount_value}% OFF`
                        : `₹${c.discount_value} OFF`}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Minimum Order ₹{c.min_order}
                    </p>

                    <button
                      className="mt-3 w-full rounded-full bg-primary py-2 text-white"
                      onClick={async () => {
                        setCouponCode(c.code);
                        setShowCoupons(false);

                        const minOrder = Number(c.min_order ?? 0);

                        if (checkoutSubtotal < minOrder) {
                          const remaining = minOrder - checkoutSubtotal;

                          toast.error(
                            `${c.code} requires a minimum order of ${formatINR(
                              minOrder
                            )}. Add ${formatINR(remaining)} more to unlock this offer.`
                          );

                          return;
                        }

                        let value = 0;

                        if (c.discount_type === "percent") {
                          value =
                            checkoutSubtotal *
                            Number(c.discount_value) /
                            100;

                          if (c.max_discount) {
                            value = Math.min(value, Number(c.max_discount));
                          }
                        } else {
                          value = Number(c.discount_value);
                        }

                        setCoupon(c);
                        setDiscount(value);

                        toast.success(
                          `${c.code} applied successfully! You saved ${formatINR(value)}`
                        );
                      }}
                    >
                      Apply Coupon
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          border-radius: 9999px;
          padding: 0.75rem 1.25rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px oklch(0.7 0.09 30 / 0.15);
        }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
      <h2 className="mb-5 font-serif text-xl font-medium">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs tracking-wider text-charcoal/70 uppercase">
        {label} {required && <span className="text-ruby">*</span>}
      </span>
      {children}
    </label>
  );
}
