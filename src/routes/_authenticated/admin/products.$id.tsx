import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm, type ProductInput } from "@/components/admin/ProductForm";
import { deleteStorageFile } from "@/lib/deleteStorageFile";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();


  const { data, isLoading } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      const { data: variants, error: variantError } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", id);

      if (variantError) throw variantError;

      return {
        ...product,
        variants: variants ?? [],
      };
    },
  });

  if (isLoading) return <div>Loading…</div>;
  if (!data) return <div>Not found</div>;

  const save = async (p: ProductInput) => {
    const oldImages = data.images ?? [];

    const { error } = await supabase
      .from("products")
      .update({
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
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    for (const image of oldImages) {
      if (!p.images.includes(image)) {
        await deleteStorageFile(image);
      }
    }
    // Delete old variants
    const { error: deleteError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", id);

    if (deleteError) {
      toast.error(deleteError.message);
      return;
    }

    // Insert current variants
    if (p.variants.length > 0) {
      const { error: variantError } = await supabase
        .from("product_variants")
        .insert(
          p.variants.map((v) => ({
            product_id: id,
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
        );

      if (variantError) {
        toast.error(variantError.message);
        return;
      }
    }
    await qc.invalidateQueries({ queryKey: ["products"] });
    await qc.invalidateQueries({ queryKey: ["admin-products"] });
    await qc.invalidateQueries({ queryKey: ["admin-product", id] });
    toast.success("Product updated");
    navigate({ to: "/admin/products" });
  };

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-medium">Edit Product</h1>
      <ProductForm
        submitLabel="Save changes"
        onSubmit={save}
        initial={{
          slug: data.slug,
          name: data.name,
          description: data.description ?? "",
          category_slug: data.category_slug,
          price: Number(data.price),
          original_price: data.original_price === null ? null : Number(data.original_price),
          stock: data.stock,
          rating: Number(data.rating),
          review_count: data.review_count,
          images: data.images ?? [],
          is_new: data.is_new,
          is_bestseller: data.is_bestseller,
          is_featured: data.is_featured,
          tags: data.tags ?? [],

          gst_enabled: data.gst_enabled,
          gst_rate: Number(data.gst_rate),
          variants: (data.variants ?? []).map((v: any) => ({
            id: v.id,
            color: v.color ?? "",
            size: v.size ?? "",
            weight: v.weight ?? "",
            material: v.material ?? "",
            purity: v.purity ?? "",
            finish: v.finish ?? "",
            occasion: v.occasion ?? "",
            style: v.style ?? "",
            sku: v.sku ?? "",
            price: v.price,
            stock: v.stock ?? 0,
            images: v.images ?? [],
          })),
        }}
      />
    </div>
  );
}
