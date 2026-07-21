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
import { deleteStorageFile } from "@/lib/deleteStorageFile";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");

      if (error) throw error;

      return data ?? [];
    },
  });

  const remove = async (
    id: string,
    name: string,
    imageUrl: string | null
  ) => {
    if (!confirm(`Delete "${name}"?`)) return;

    if (imageUrl) {
      await deleteStorageFile(imageUrl);
    }

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

  const filteredCategories =
    categories?.filter((cat) => {
      const q = search.toLowerCase();

      return (
        cat.name?.toLowerCase().includes(q) ||
        cat.slug?.toLowerCase().includes(q)
      );
    }) ?? [];

  if (pathname !== "/admin/categories") {
    return <Outlet />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">
            Categories
          </h1>

          <p className="text-sm text-muted-foreground">
            Manage all product categories
          </p>
        </div>

        <Link
          to="/admin/categories/new"
          className="inline-flex items-center gap-2 rounded-full bg-rose-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border bg-background py-3 pl-10 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-background shadow-soft">
        <table className="w-full">
          <thead className="border-b bg-blush/30">
            <tr>
              <th className="p-4 text-left text-xs uppercase tracking-wider">
                Image
              </th>

              <th className="p-4 text-left text-xs uppercase tracking-wider">
                Category
              </th>

              <th className="p-4 text-left text-xs uppercase tracking-wider">
                Slug
              </th>

              <th className="p-4 text-left text-xs uppercase tracking-wider">
                Order
              </th>

              <th className="p-4 text-right text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-10 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredCategories.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-10 text-center text-muted-foreground"
                >
                  No categories found.
                </td>
              </tr>
            ) : (
              filteredCategories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b transition hover:bg-blush/20"
                >
                  <td className="p-4">
                    <img
                      src={
                        cat.image_url ||
                        "https://placehold.co/80x80"
                      }
                      alt={cat.name}
                      className="h-12 w-12 rounded-lg border object-cover"
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

                  <td className="p-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      {cat.sort_order}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="inline-flex gap-2">
                      <Link
                        to="/admin/categories/$id"
                        params={{ id: cat.id }}
                        className="rounded-lg p-2 hover:bg-blush"
                        title="Edit Category"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() =>
                          remove(
                            cat.id,
                            cat.name,
                            cat.image_url
                          )
                        }
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete Category"
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