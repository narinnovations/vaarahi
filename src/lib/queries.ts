import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  color: string | null;
  size: string |null;
  weight: string | null;
  material: string | null;
  purity: string | null;
  finish: string | null;
  occasion: string | null;
  style: string | null;
  sku: string | null;
  price: number | null;
  stock: number;
  images: string[];
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

  variants: ProductVariant[];
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

export const productsQuery = (filters?: {
  category?: string;
  featured?: boolean;
  bestseller?: boolean;
  isNew?: boolean;
  limit?: number;
}) =>
  queryOptions({
    queryKey: ["products", filters ?? {}],

    queryFn: async (): Promise<Product[]> => {
      let q = supabase.from("products").select("*");

      if (filters?.category)
        q = q.eq("category_slug", filters.category);

      if (filters?.featured)
        q = q.eq("is_featured", true);

      if (filters?.bestseller)
        q = q.eq("is_bestseller", true);

      if (filters?.isNew)
        q = q.eq("is_new", true);

      if (filters?.limit)
        q = q.limit(filters.limit);

      const { data, error } = await q.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      return (data ?? []).map(normalize);
    },
  });

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],

    queryFn: async (): Promise<Product | null> => {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      if (!product) return null;

      const { data: variants, error: variantError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id);

      if (variantError) throw variantError;

      return {
        ...normalize(product),
        variants: (variants ?? []).map((v) => ({
          ...v,
          price: v.price === null ? null : Number(v.price),
        })),
      };
    },
  });

function normalize(row: Record<string, any>): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category_slug: row.category_slug,

    price: Number(row.price),

    original_price:
      row.original_price === null
        ? null
        : Number(row.original_price),

    images: row.images ?? [],

    stock: Number(row.stock ?? 0),

    rating: Number(row.rating ?? 0),

    review_count: Number(row.review_count ?? 0),

    is_new: Boolean(row.is_new),

    is_bestseller: Boolean(row.is_bestseller),

    is_featured: Boolean(row.is_featured),

    tags: row.tags ?? [],

    // IMPORTANT
    variants: [],
  };
}