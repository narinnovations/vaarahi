import {
  createFileRoute,
  Link,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [search, setSearch] = useState("");

  const qc = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,image_url,sort_order,is_active")
        .order("sort_order");

      if (error) throw error;

      return data ?? [];
    },
  });

  const remove = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Category deleted");

    qc.invalidateQueries({
      queryKey: ["admin-categories"],
    });
  };

  const toggleStatus = async (
    id: string,
    current: boolean
  ) => {
    const { error } = await supabase
      .from("categories")
      .update({
        is_active: !current,
      })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(
      !current
        ? "Category Activated"
        : "Category Deactivated"
    );

    qc.invalidateQueries({
      queryKey: ["admin-categories"],
    });
  };

  if (pathname !== "/admin/categories") {
    return <Outlet />;
  }

  const filtered =
    categories?.filter((cat) =>
      cat.name.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold">
            Categories
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage all product categories
          </p>
        </div>

        <Link
          to="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-full bg-rose-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />

        <input
          placeholder="Search categories..."
          className="w-full rounded-2xl border bg-background py-3 pl-12 pr-4 shadow-soft"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-background shadow-soft">
        <table className="w-full">
          <thead className="border-b bg-blush/30">
            <tr>
              <th className="p-4 text-left">Image</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Slug</th>
              <th className="p-4 text-center">Order</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-10 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              filtered.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b hover:bg-blush/20"
                >
                  <td className="p-4">
                    <img
                      src={
                        cat.image_url ||
                        "https://placehold.co/80x80"
                      }
                      alt={cat.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </td>

                  <td className="p-4 font-medium">
                    {cat.name}
                  </td>

                  <td className="p-4">
                    <span className="rounded-full bg-blush px-3 py-1 text-xs">
                      {cat.slug}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    {cat.sort_order}
                  </td>

                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={cat.is_active}
                        onCheckedChange={() =>
                          toggleStatus(
                            cat.id,
                            cat.is_active
                          )
                        }
                      />

                      <span
                        className={`text-xs font-semibold ${
                          cat.is_active
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      >
                        {cat.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        to="/admin/categories/$id"
                        params={{ id: cat.id }}
                        className="rounded-lg p-2 hover:bg-blush"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() =>
                          remove(cat.id, cat.name)
                        }
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}