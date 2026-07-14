import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_slug: string;
  price: number;
  original_price: number | null;
  images: string[];
  stock: number;
  rating: number;
  review_count: number;
  is_new: boolean;
  is_bestseller: boolean;
  is_featured: boolean;
  tags: string[];
};

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("slug,name,description,image_url,sort_order")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

export const productsQuery = (filters?: { category?: string; featured?: boolean; bestseller?: boolean; isNew?: boolean; limit?: number }) =>
  queryOptions({
    queryKey: ["products", filters ?? {}],
    queryFn: async (): Promise<Product[]> => {
      let q = supabase.from("products").select("*");
      if (filters?.category) q = q.eq("category_slug", filters.category);
      if (filters?.featured) q = q.eq("is_featured", true);
      if (filters?.bestseller) q = q.eq("is_bestseller", true);
      if (filters?.isNew) q = q.eq("is_new", true);
      if (filters?.limit) q = q.limit(filters.limit);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(normalize);
    },
  });

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? normalize(data) : null;
    },
  });

function normalize(row: Record<string, unknown>): Product {
  return {
    ...(row as Product),
    price: Number(row.price),
    original_price: row.original_price === null ? null : Number(row.original_price),
    rating: Number(row.rating),
  };
}
