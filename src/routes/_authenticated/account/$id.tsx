import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/format";
import { resolveImage } from "@/lib/images";

export const Route = createFileRoute("/_authenticated/account/$id")({
    component: OrderDetailsPage,
});

function OrderDetailsPage() {
    const { id } = Route.useParams();

    const { data: order, isLoading, error } = useQuery({
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
    const { data: items } = useQuery({
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

    console.log("ORDER =", order);
    console.log("ERROR =", error);
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
                        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
                            <h2 className="mb-5 font-serif text-2xl">Ordered Items</h2>

                            <div className="space-y-4">
                                {items?.map((item) => (
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

                                        <div className="text-right">
                                            <div className="font-serif text-xl">
                                                {formatINR(Number(item.price) * item.quantity)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>

            </div>

        </div>

    );

}
