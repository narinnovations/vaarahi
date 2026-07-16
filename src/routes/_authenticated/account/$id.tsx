import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowLeft,
    Check,
    Package,
    Truck,
    PackageCheck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";


export const Route = createFileRoute("/_authenticated/account/$id")({
    component: OrderDetailsPage,
});

function OrderDetailsPage() {
    const { id } = Route.useParams();

    const {
        data: order,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["customer-order", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("orders")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;

            return data;
        },
    });

    const { data: items = [] } = useQuery({
        queryKey: ["customer-order-items", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("order_items")
                .select("*")
                .eq("order_id", id);

            if (error) throw error;

            return data ?? [];
        },
    });

    console.log(order);
    console.log(error);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                Loading order...
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                Order not found.
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10">

            <Link
                to="/account"
                className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to My Account
            </Link>

            {/* Order Summary */}

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">

                <h1 className="font-serif text-3xl">
                    Order {order.order_number}
                </h1>

                <p className="mt-2 text-muted-foreground">
                    Placed on{" "}
                    {order.created_at
                        ? new Date(order.created_at).toLocaleString("en-IN")
                        : "N/A"}
                </p>

                <div className="mt-6 grid gap-4 md:grid-cols-3">

                    <div className="rounded-xl bg-blush/40 p-4">

                        <div className="text-xs uppercase text-muted-foreground">
                            Status
                        </div>

                        <div className="mt-2 text-lg font-semibold capitalize">
                            {order.status}
                        </div>

                    </div>

                    <div className="rounded-xl bg-blush/40 p-4">

                        <div className="text-xs uppercase text-muted-foreground">
                            Payment
                        </div>

                        <div className="mt-2 text-lg font-semibold">
                            {(order.payment_method ?? "N/A").toUpperCase()}
                        </div>

                        <div className="text-sm text-muted-foreground capitalize">
                            {order.payment_status ?? "Pending"}
                        </div>

                    </div>

                    <div className="rounded-xl bg-blush/40 p-4">

                        <div className="text-xs uppercase text-muted-foreground">
                            Total
                        </div>

                        <div className="mt-2 text-2xl font-serif">
                            {formatINR(Number(order.total))}
                        </div>

                    </div>

                </div>

                <ShippingTimeline status={order.status} />

            </div>

            {/* Ordered Items */}

            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">

                <h2 className="mb-5 font-serif text-2xl">
                    Ordered Items
                </h2>

                {items.length > 0 ? (

                    <div className="space-y-4">

                        {items.map((item) => (

                            <div
                                key={item.id}
                                className="flex items-center justify-between rounded-xl border border-border p-4"
                            >

                                <div className="flex items-center gap-4">

                                    <img
                                        src={resolveImage(item.image)}
                                        alt={item.product_name}
                                        className="h-20 w-20 rounded-lg object-cover"
                                    />

                                    <div>

                                        <h3 className="font-medium text-lg">
                                            {item.product_name}
                                        </h3>

                                        <p className="text-sm text-muted-foreground">
                                            Qty: {item.quantity}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            Price: {formatINR(Number(item.price))}
                                        </p>

                                    </div>

                                </div>

                                <div className="font-serif text-xl">
                                    {formatINR(Number(item.price) * item.quantity)}
                                </div>

                            </div>

                        ))}

                    </div>

                ) : (

                    <div className="py-8 text-center text-muted-foreground">
                        No items found for this order.
                    </div>

                )}

            </div>
            {/* Shipping Address */}

            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">

                <h2 className="mb-5 font-serif text-2xl">
                    Shipping Address
                </h2>

                <div className="space-y-2 text-sm">

                    <div className="font-medium">
                        {order.customer_name}
                    </div>

                    <div className="text-muted-foreground">
                        {order.customer_phone}
                    </div>

                    <div>
                        {order.address_line1}
                    </div>

                    {order.address_line2 && (
                        <div>
                            {order.address_line2}
                        </div>
                    )}

                    <div>
                        {order.city}, {order.state}
                    </div>

                    <div>
                        {order.pincode}
                    </div>

                    <div>
                        {order.country}
                    </div>

                </div>

            </div>
            {/* Price Breakdown */}

            <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">

                <h2 className="mb-5 font-serif text-2xl">
                    Price Details
                </h2>

                <div className="space-y-3">

                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatINR(Number(order.subtotal ?? order.total))}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span>
                            {Number(order.shipping ?? 0) === 0
                                ? "FREE"
                                : formatINR(Number(order.shipping))}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Discount</span>
                        <span className="text-green-600">
                            -{formatINR(Number(order.discount ?? 0))}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Coupon</span>
                        <span>{order.coupon_code ?? "-"}</span>
                    </div>

                    <hr />

                    <div className="flex justify-between text-lg font-semibold">

                        <span>Total Paid</span>

                        <span>
                            {formatINR(Number(order.total))}
                        </span>

                    </div>

                </div>

            </div>

        </div>

    );
}

const STEPS = [
    {
        key: "pending",
        label: "Placed",
        Icon: Check,
    },
    {
        key: "accepted",
        label: "Confirmed",
        Icon: Package,
    },
    {
        key: "shipped",
        label: "Shipped",
        Icon: Truck,
    },
    {
        key: "delivered",
        label: "Delivered",
        Icon: PackageCheck,
    },
] as const;

function ShippingTimeline({
    status,
}: {
    status: string;
}) {
    const current = STEPS.findIndex((step) => step.key === status);

    const active = current === -1 ? 0 : current;

    return (
        <div className="mt-8">

            <h2 className="mb-5 font-serif text-2xl">
                Order Status
            </h2>

            <div className="flex items-center">

                {STEPS.map((step, index) => {

                    const done = index <= active;

                    return (
                        <div
                            key={step.key}
                            className="flex flex-1 items-center last:flex-none"
                        >

                            <div className="flex flex-col items-center">

                                <div
                                    className={`grid h-10 w-10 place-items-center rounded-full border-2 ${done
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border bg-background text-muted-foreground"
                                        }`}
                                >
                                    <step.Icon className="h-5 w-5" />
                                </div>

                                <div
                                    className={`mt-2 text-xs uppercase tracking-wider ${done
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground"
                                        }`}
                                >
                                    {step.label}
                                </div>

                            </div>

                            {index < STEPS.length - 1 && (

                                <div
                                    className={`mx-2 h-1 flex-1 rounded-full ${index < active
                                        ? "bg-primary"
                                        : "bg-border"
                                        }`}
                                />

                            )}

                        </div>
                    );

                })}

            </div>

        </div>
    );
}