import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function useWishlist() {
    const { user } = useAuth();

    const [wishlist, setWishlist] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setWishlist([]);
            setLoading(false);
            return;
        }

        loadWishlist();
    }, [user]);

    async function loadWishlist() {
        if (!user) return;

        setLoading(true);

        const { data, error } = await supabase
            .from("wishlists")
            .select("product_id")
            .eq("user_id", user.id);

        if (error) {
            console.error(error);
        } else {
            setWishlist(data.map((item) => item.product_id));
        }

        setLoading(false);
    }

    async function add(productId: string) {
        if (!user) {
            console.log("No user logged in");
            return false;
        }

        console.log("User ID:", user.id);
        console.log("Product ID:", productId);

        const { data, error } = await supabase
            .from("wishlists")
            .insert({
                user_id: user.id,
                product_id: productId,
            })
            .select();

        console.log("Insert Result:", data);
        console.log("Insert Error:", error);

        if (error) {
            return false;
        }

        setWishlist((prev) => [...prev, productId]);
        return true;
    }
    async function remove(productId: string) {
        if (!user) return false;

        const { error } = await supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);

        if (!error) {
            setWishlist((prev) =>
                prev.filter((id) => id !== productId)
            );

            return true;
        }

        return false;
    }

    function isWishlisted(productId: string) {
        return wishlist.includes(productId);
    }

    return {
        wishlist,
        loading,
        add,
        remove,
        isWishlisted,
    };
}