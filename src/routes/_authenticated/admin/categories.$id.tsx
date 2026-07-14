import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CategoryForm,
  type CategoryInput,
} from "@/components/admin/CategoryForm";

export const Route = createFileRoute("/_authenticated/admin/categories/$id")({
  component: EditCategoryPage,
});

function EditCategoryPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: category, isLoading } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return data;
    },
  });

  const update = async (values: CategoryInput) => {
    const { error } = await supabase
      .from("categories")
      .update({
        name: values.name,
        slug: values.slug,
        description: values.description,
        image_url: values.image_url,
        sort_order: values.sort_order,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Category updated");

    await qc.invalidateQueries({
      queryKey: ["admin-categories"],
    });

    navigate({
      to: "/admin/categories",
    });
  };

  if (isLoading) {
    return (
      <div className="p-10 text-center">
        Loading...
      </div>
    );
  }

  if (!category) {
    return (
      <div className="p-10 text-center">
        Category not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">
          Edit Category
        </h1>

        <p className="text-muted-foreground">
          Update category information
        </p>
      </div>

      <CategoryForm
        initialValues={{
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          image_url: category.image_url ?? "",
          sort_order: category.sort_order,
        }}
        submitLabel="Update Category"
        onSubmit={update}
      />
    </div>
  );
}