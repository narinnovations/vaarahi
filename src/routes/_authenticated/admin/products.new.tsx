import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductInput } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProduct,
});

function NewProduct() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const save = async (p: ProductInput) => {
    const { error } = await supabase.from("products").insert({
      slug: p.slug,
      name: p.name,
      description: p.description || null,
      category_slug: p.category_slug,
      price: p.price,
      original_price: p.original_price,
      stock: p.stock,

      rating: p.rating,
      review_count: p.review_count,

      images: p.images,
      is_new: p.is_new,
      is_bestseller: p.is_bestseller,
      is_featured: p.is_featured,
      tags: p.tags,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    await qc.invalidateQueries({ queryKey: ["products"] });
    await qc.invalidateQueries({ queryKey: ["admin-products"] });
    toast.success("Product created");
    navigate({ to: "/admin/products" });
  };
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-medium">Add Product</h1>
      <ProductForm onSubmit={save} submitLabel="Create product" />
    </div>
  );
}
