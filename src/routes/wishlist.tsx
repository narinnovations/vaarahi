import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Product } from "@/lib/queries";
import { resolveImage } from "@/lib/images";
import { formatINR } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/wishlist")({
    component: WishlistPage,
});

function WishlistPage() {
    const { user } = useAuth();
    const { remove } = useWishlist();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadWishlist();
        } else {
            setLoading(false);
        }
    }, [user]);

    async function loadWishlist() {
        if (!user) return;

        setLoading(true);

        // Step 1: Get wishlist entries
        const { data: wishlistData, error: wishlistError } = await supabase
            .from("wishlists")
            .select("product_id")
            .eq("user_id", user.id);

        if (wishlistError) {
            console.error(wishlistError);
            setLoading(false);
            return;
        }

        if (!wishlistData || wishlistData.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }

        // Step 2: Get products
        const productIds = wishlistData.map((item) => item.product_id);

        const { data: productData, error: productError } = await supabase
            .from("products")
            .select("*")
            .in("id", productIds);

        if (productError) {
            console.error(productError);
            setLoading(false);
            return;
        }

        setProducts(productData as Product[]);
        setLoading(false);
    }
    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-12 text-center">
                Loading wishlist...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h1 className="mt-4 text-3xl font-serif">Wishlist</h1>
                <p className="mt-2 text-muted-foreground">
                    Please login to view your wishlist.
                </p>

                <Link
                    to="/auth"
                    className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-primary-foreground"
                >
                    Login
                </Link>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-16 text-center">
                <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h1 className="mt-4 text-3xl font-serif">Your Wishlist is Empty</h1>
                <p className="mt-2 text-muted-foreground">
                    Save your favourite products here.
                </p>

                <Link
                    to="/products"
                    className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-primary-foreground"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8">
            <h1 className="mb-8 text-3xl font-serif">My Wishlist</h1>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                    <div
                        key={product.id}
                        className="rounded-2xl border bg-card shadow-sm overflow-hidden"
                    >
                        <Link
                            to="/products/$slug"
                            params={{ slug: product.slug }}
                        >
                            <img
                                src={resolveImage(product.images[0])}
                                alt={product.name}
                                className="aspect-square w-full object-cover"
                            />
                        </Link>

                        <div className="p-4">
                            <Link
                                to="/products/$slug"
                                params={{ slug: product.slug }}
                                className="font-medium hover:text-primary"
                            >
                                {product.name}
                            </Link>

                            <p className="mt-2 font-semibold">
                                {formatINR(product.price)}
                            </p>

                            <button
                                onClick={async () => {
                                    await remove(product.id);
                                    setProducts((prev) =>
                                        prev.filter((p) => p.id !== product.id)
                                    );
                                }}
                                className="mt-4 w-full rounded-full border py-2 text-sm hover:bg-blush"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}