import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CategoryForm,
  type CategoryInput,
} from "@/components/admin/CategoryForm";

export const Route = createFileRoute("/_authenticated/admin/categories/new")({
  component: NewCategoryPage,
});

function NewCategoryPage() {
  const navigate = useNavigate();

  const save = async (category: CategoryInput) => {
    const { error } = await supabase.from("categories").insert({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url,
      sort_order: category.sort_order,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    toast.success("Category created");
    navigate({ to: "/admin/categories" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">
          Add Category
        </h1>

        <p className="text-muted-foreground">
          Create a new category
        </p>
      </div>

      <CategoryForm
        submitLabel="Create Category"
        onSubmit={save}
      />
    </div>
  );
}