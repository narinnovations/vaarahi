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
    const { data: product, error } = await supabase
      .from("products")
      .insert({
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

        gst_enabled: p.gst_enabled,
        gst_rate: p.gst_rate,
      })
      .select("id")
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (p.variants.length > 0) {
      console.log("Product ID:", product.id);
      console.log("Variants to insert:", p.variants);

      const { data: insertedVariants, error: variantError } = await supabase
        .from("product_variants")
        .insert(
          p.variants.map((v) => ({
            product_id: product.id,
            color: v.color,
            size: v.size,
            weight: v.weight,
            material: v.material,
            purity: v.purity,
            finish: v.finish,
            occasion: v.occasion,
            style: v.style,
            sku: v.sku,
            price: v.price,
            stock: v.stock,
            images: v.images,
          }))
        )
        .select();

      console.log("Inserted variants:");
      console.log(insertedVariants);

      console.log("Variant Error:");
      console.log(variantError);

      const allVariants = await supabase
        .from("product_variants")
        .select("*");

      console.log("Database contains:");
      console.log(allVariants);

      if (variantError) {
        toast.error(variantError.message);
        return;
      }
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
